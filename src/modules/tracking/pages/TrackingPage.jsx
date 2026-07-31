/**
 * TrackingPage.jsx — New-Ausprey
 *
 * Mirrors the old Ausprey LiveTrack page:
 *  - Left panel: searchable device list — FLOATS over the map on the left
 *  - Full-screen Leaflet map (zero side gaps, minimal top header)
 *  - Live truck marker, route polyline, info overlay
 *  - Polls `getLiveTrack` every 30 s for the selected vehicle
 *  - Smooth marker animation between GPS fixes (like old project)
 *  - Route accumulation (last 100 points)
 *
 * LAYOUT FIX 1 (previous pass): default Leaflet zoom control relocated from
 * top-left (hidden behind the floating device list) to bottom-right, with
 * a margin nudge so it clears the LiveInfoOverlay bar.
 *
 * UX FIX (previous pass): selecting a vehicle from the sidebar or a map
 * marker now also auto-collapses the sidebar.
 *
 * LAYOUT FIX 2 (previous pass): the page was sitting inside the dashboard
 * layout's padded content wrapper, leaving a visible margin of blank
 * space on the left/right/bottom of the map. `-m-6` on the root element
 * cancels out that ancestor padding so the map fills the full content
 * area edge-to-edge.
 *
 * LAYOUT FIX 3 (this pass): Leaflet's internal panes and zoom control
 * carry very high z-index values (roughly 400–1000+), and this page's
 * root element wasn't establishing its own stacking context — so those
 * values were escaping up to the same global stacking layer as the app's
 * navbar dropdown, letting the map render on top of it. Added `isolate`
 * (isolation: isolate) to the root element so every z-index used inside
 * this page — Leaflet's own, plus this page's z-[900]/[1001] overlays —
 * is contained within this page's box and can never render above
 * sibling chrome like the navbar, regardless of how high those numbers
 * get bumped in the future.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Search,
  ChevronLeft,
  ChevronRight,
  Truck,
  MapPin,
  Zap,
  Gauge,
  Navigation,
  Battery,
  Clock,
  Activity,
  RotateCcw,
} from "lucide-react";

import { Card, Skeleton } from "@/components/ui";
import { MapStyleControl } from "@/components/maps";
import { MAP_MODES, DEFAULT_MAP_MODE } from "@/utils/mapTiles";
import { cn } from "@/utils";
import { useAccountStore } from "@/store";
import { trackingService } from "../services/tracking.service";
import { useLiveVehicles } from "../hooks/useLiveVehicles";

// ─── Leaflet icon fix ─────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcBearing = (from, to) => {
  if (!from || !to) return 0;
  const [lat1, lng1] = from.map((d) => (d * Math.PI) / 180);
  const [lat2, lng2] = to.map((d) => (d * Math.PI) / 180);
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const STATUS_META = {
  Running: {
    label: "Running",
    bg: "bg-emerald-500",
    text: "text-emerald-700",
    light: "bg-emerald-50",
  },
  Idle: {
    label: "Idle",
    bg: "bg-amber-400",
    text: "text-amber-700",
    light: "bg-amber-50",
  },
  Stopped: {
    label: "Stopped",
    bg: "bg-rose-500",
    text: "text-rose-700",
    light: "bg-rose-50",
  },
  Inactive: {
    label: "Inactive",
    bg: "bg-slate-400",
    text: "text-slate-600",
    light: "bg-slate-100",
  },
  "No Data": {
    label: "No Data",
    bg: "bg-slate-300",
    text: "text-slate-500",
    light: "bg-slate-50",
  },
};

const markerColor = (s) =>
  s === "Running"
    ? "#10b981"
    : s === "Stopped"
      ? "#ef4444"
      : s === "Idle"
        ? "#f59e0b"
        : "#94a3b8";

const TRUCK_ICON_URL =
  "https://cdn-icons-png.flaticon.com/512/1048/1048329.png";

// Stable icon instance — created ONCE, rotation updated via DOM mutation (no flicker)
const TRUCK_ICON_INSTANCE = L.divIcon({
  className: "truck-marker-icon",
  html: `<div id="truck-inner" style="
    width:40px;height:40px;
    transform:rotate(0deg);
    transition:transform 0.6s ease-out;
    display:flex;justify-content:center;align-items:center;
    filter:drop-shadow(0px 3px 5px rgba(0,0,0,0.4));
    will-change:transform;
  ">
    <img src="${TRUCK_ICON_URL}" style="width:100%;height:100%;display:block;" />
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Small coloured pin dot for non-selected fleet vehicles
const buildDotIcon = (status) => {
  const color = markerColor(status);
  return L.divIcon({
    className: "",
    html: `<div style="
      background-color:${color};
      width:18px;height:18px;
      border-radius:50% 50% 50% 0;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      transform:rotate(-45deg);
      position:relative;
    ">
      <div style="
        position:absolute;top:3px;left:3px;
        width:6px;height:6px;
        background:white;border-radius:50%;
      "></div>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -20],
  });
};

// Updates the truck rotation in-place via DOM — zero flicker, smooth CSS transition
function TruckMarker({ position, bearing, vehicle, liveData }) {
  const markerRef = useRef(null);
  const prevBearingRef = useRef(0);

  // Mutate the rotation style directly — never recreate the icon
  useEffect(() => {
    if (!markerRef.current) return;
    const el = markerRef.current.getElement();
    if (!el) return;
    const inner = el.querySelector("#truck-inner");
    if (!inner) return;
    // The flaticon truck image faces East (right) at 0°.
    // Road polylines use standard geographic bearing (0° = North).
    // Offset: -90° so the truck nose aligns with the direction of travel.
    const rotation = bearing - 115;
    inner.style.transform = `rotate(${rotation}deg)`;
    prevBearingRef.current = rotation;
  }, [bearing]);

  if (!position) return null;

  return (
    <Marker ref={markerRef} position={position} icon={TRUCK_ICON_INSTANCE}>
      <Popup>
        <div className="text-sm font-bold">{vehicle?.name}</div>
        <div className="text-xs text-slate-500">
          {vehicle?.status} · {liveData?.speed ?? vehicle?.speed ?? 0} km/h
        </div>
      </Popup>
    </Marker>
  );
}

// ─── Map sub-components ───────────────────────────────────────────────────────
function MapFixer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    const fn = () => map.invalidateSize();
    window.addEventListener("resize", fn);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", fn);
    };
  }, [map]);
  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!position) return;
    const key = position.join(",");
    if (key === prev.current) return;
    prev.current = key;
    map.flyTo(position, 15, { duration: 1.5, easeLinearity: 0.3 });
  }, [position, map]);
  return null;
}

// ─── Left panel — device list (floats over the map) ──────────────────────────
function DeviceListPanel({
  vehicles,
  loading,
  selectedId,
  onSelect,
  collapsed,
  onToggle,
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return vehicles.filter(
      (v) => !term || (v.name ?? v.id ?? "").toLowerCase().includes(term),
    );
  }, [vehicles, search]);

  // Collapsed: show only the expand button
  if (collapsed) {
    return (
      <div className="flex flex-col items-center pt-3">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition"
          title="Expand sidebar"
        >
          <ChevronRight size={18} className="text-slate-600" />
        </button>
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full p-0 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-800 rounded-t-2xl shrink-0">
        <span className="text-sm font-bold text-white">
          Live Devices ({filtered.length})
        </span>
        {/* ChevronLeft = collapse toward the left edge */}
        <button
          onClick={onToggle}
          className="text-slate-300 hover:text-white transition"
          title="Collapse sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vehicle / IMEI..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-3 py-2.5 border-b border-slate-50">
                <Skeleton className="h-8 w-full rounded" />
              </div>
            ))
          : filtered.map((v) => {
              const meta = STATUS_META[v.status] ?? STATUS_META["No Data"];
              const isAct = selectedId === v.id;
              return (
                <button
                  key={v.id}
                  ref={
                    isAct
                      ? (el) => el?.scrollIntoView({ block: "nearest" })
                      : null
                  }
                  onClick={() => onSelect(v)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 border-b transition flex items-center gap-2.5",
                    isAct
                      ? "bg-primary border-b-primary/20 border-l-[3px] border-l-primary"
                      : "border-b-slate-50 border-l-[3px] border-l-transparent hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn("w-2 h-2 rounded-full shrink-0", meta.bg)}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-xs font-bold truncate",
                        isAct ? "text-white" : "text-slate-800",
                      )}
                    >
                      {v.name ?? v.id}
                    </div>
                    <div
                      className={cn(
                        "text-[11px] truncate",
                        isAct ? "text-blue-200" : "text-slate-400",
                      )}
                    >
                      {v.lastUpdate ?? "—"}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                      isAct
                        ? "bg-white/20 text-white"
                        : cn(meta.light, meta.text),
                    )}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
      </div>
    </Card>
  );
}

// ─── Bottom info bar ──────────────────────────────────────────────────────────
function StatCell({ icon: Icon, label, value, iconColor = "text-slate-400" }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-3 border-r border-slate-100 last:border-r-0 min-w-[100px]">
      <div className={cn("mb-0.5", iconColor)}>
        <Icon size={16} />
      </div>
      <div className="text-base font-extrabold text-slate-900 leading-tight">
        {value ?? "—"}
      </div>
      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}

function LiveInfoOverlay({ vehicle, liveData }) {
  if (!vehicle) return null;
  const d = liveData ?? vehicle;

  const speed = Number(d.speed ?? vehicle.speed ?? 0);
  const distance = Number(d.distance ?? 0).toFixed(1);
  const status = vehicle.status ?? "—";
  const ignition = d.ign === "Y" ? "ON" : "OFF";
  const battery = d.misc?.batteryPercentage
    ? `${d.misc.batteryPercentage} V`
    : "—";
  const odometer = d.misc?.odometer
    ? `${Number(d.misc.odometer).toLocaleString()} km`
    : "—";
  const updated = d.devTs ?? d.cts ?? vehicle.lastUpdate ?? "—";
  const address = d.address ?? "—";
  const vehName = d.vehnum ?? vehicle.name ?? "—";

  const statusColor =
    status === "Running"
      ? "text-emerald-500"
      : status === "Stopped"
        ? "text-rose-500"
        : status === "Idle"
          ? "text-amber-500"
          : "text-slate-400";

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[900] bg-white/97 backdrop-blur border-t border-slate-200 shadow-lg">
      {/* Vehicle name + address strip */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-slate-100">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center">
            <Truck size={12} className="text-white" />
          </div>
          <span className="text-sm font-extrabold text-slate-900">
            {vehName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-700 truncate">
          <MapPin size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{address}</span>
        </div>
        <div className="ml-auto shrink-0 flex items-center gap-1 text-xs text-slate-600 font-medium">
          <Clock size={11} />
          <span>{updated}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-stretch overflow-x-auto">
        <StatCell
          icon={Gauge}
          label="Speed"
          value={`${speed} km/h`}
          iconColor="text-blue-500"
        />
        <StatCell
          icon={Navigation}
          label="Distance"
          value={`${distance} km`}
          iconColor="text-emerald-500"
        />
        <StatCell
          icon={Activity}
          label="Status"
          value={status}
          iconColor={statusColor}
        />
        <StatCell
          icon={Zap}
          label="Ignition"
          value={ignition}
          iconColor={ignition === "ON" ? "text-emerald-500" : "text-rose-400"}
        />
        <StatCell
          icon={Battery}
          label="Battery"
          value={battery}
          iconColor="text-amber-500"
        />
        <StatCell
          icon={RotateCcw}
          label="Odometer"
          value={odometer}
          iconColor="text-purple-500"
        />
        <StatCell
          icon={Navigation}
          label="Bearing"
          value={d.disha != null ? `${d.disha}°` : "—"}
          iconColor="text-slate-400"
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const accid = useAccountStore((s) => s.selectedAccount?.id ?? 1);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const imeiFromQuery = searchParams.get("imei");
  const imeiFromState = location.state?.targetImei;
  const targetImei = imeiFromState || imeiFromQuery;
  const targetAccId = location.state?.targetAccountId ?? accid;

  // All vehicles from the fleet list
  const { data: rawVehicles = [], isLoading } = useLiveVehicles();

  // Normalise fleet list
  const vehicles = useMemo(
    () =>
      rawVehicles.filter((v) => v).map((v) => ({ ...v, name: v.name ?? v.id })),
    [rawVehicles],
  );

  const [collapsed, setCollapsed] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Live telemetry for the selected vehicle
  const [liveData, setLiveData] = useState(null);
  const [route, setRoute] = useState([]);
  const [animPos, setAnimPos] = useState(null);
  const [bearing, setBearing] = useState(0);
  const [flyTarget, setFlyTarget] = useState(null);
  const animFrameRef = useRef(null);
  const prevPosRef = useRef(null);
  const liveIntervalRef = useRef(null);

  // Select initial device — prefer targetImei from navigation state
  useEffect(() => {
    if (!vehicles.length) return;
    if (targetImei) {
      const match = vehicles.find(
        (v) => v.id === targetImei || v.imei === targetImei,
      );
      if (match) {
        setSelectedId(match.id);
        return;
      }
    }
    if (!selectedId) setSelectedId(vehicles[0].id);
  }, [vehicles, targetImei]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedId) ?? null,
    [vehicles, selectedId],
  );

  // ── Smooth animation ──────────────────────────────────────────────────────
  const animateTo = useCallback((from, to, duration = 28_000) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (!from || !to || (from[0] === to[0] && from[1] === to[1])) {
      setAnimPos(to);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const raw = Math.min((now - start) / duration, 1);
      const t = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;
      const pos = [
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
      ];
      if (prevPosRef.current) setBearing(calcBearing(prevPosRef.current, pos));
      prevPosRef.current = pos;
      setAnimPos(pos);
      if (raw < 1) animFrameRef.current = requestAnimationFrame(step);
      else animFrameRef.current = null;
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // ── Poll live telemetry every 30 s ────────────────────────────────────────
  const fetchLive = useCallback(async () => {
    if (!selectedVehicle) return;
    const effectiveAccId = selectedVehicle.accountId ?? targetAccId ?? accid;
    const imei = selectedVehicle.id;
    try {
      const res = await trackingService.getLiveTrack(effectiveAccId, imei);
      if (res?.resultCode !== 1 || !res?.data) return;
      const d = res.data;
      setLiveData(d);
      const newPos = [parseFloat(d.lat), parseFloat(d.lng)];
      if (!isNaN(newPos[0]) && !isNaN(newPos[1])) {
        setFlyTarget(newPos);
        setRoute((prev) => {
          const prevPos = prev.length ? prev[prev.length - 1] : null;
          animateTo(prevPos, newPos, 28_000);
          return [...prev, newPos].slice(-100);
        });
      }
    } catch (e) {
      console.error("LiveTrack poll error:", e);
    }
  }, [selectedVehicle, accid, targetAccId, animateTo]);

  // Reset when selected device changes
  useEffect(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAnimPos(null);
    setRoute([]);
    setLiveData(null);
    setFlyTarget(null);
    prevPosRef.current = null;
    setBearing(0);
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    if (!selectedVehicle) return;
    fetchLive();
    liveIntervalRef.current = setInterval(fetchLive, 30_000);
    return () => {
      clearInterval(liveIntervalRef.current);
    };
  }, [selectedId]);

  useEffect(
    () => () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    },
    [],
  );

  // ── Derived map state ─────────────────────────────────────────────────────
  const renderedPos = useMemo(() => {
    if (animPos) return animPos;
    if (route.length) return route[route.length - 1];
    if (selectedVehicle?.lat && selectedVehicle?.lng)
      return [selectedVehicle.lat, selectedVehicle.lng];
    return null;
  }, [animPos, route, selectedVehicle]);

  const mapCenter = useMemo(() => {
    if (selectedVehicle?.lat) return [selectedVehicle.lat, selectedVehicle.lng];
    return [22.2587, 71.1924];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const allMarkers = useMemo(
    () =>
      vehicles
        .filter((v) => v.lat && v.lng)
        .map((v) => ({
          id: v.id,
          lat: v.lat,
          lng: v.lng,
          color: markerColor(v.status),
          name: v.name,
          status: v.status,
          speed: v.speed,
        })),
    [vehicles],
  );

  const [mapMode, setMapMode] = useState(DEFAULT_MAP_MODE);
  const activeTile = MAP_MODES[mapMode];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 isolate">
      {/* ── Minimal header strip ── */}
      <div className="px-4 py-1.5 shrink-0 flex items-center justify-between border-b border-slate-100 bg-white">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Home</span>
          <span className="text-slate-300">›</span>
          <span className="font-semibold text-slate-700">Live Tracking</span>
        </nav>
        <button
          onClick={fetchLive}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
        >
          <RotateCcw size={12} /> Refresh
        </button>
      </div>

      {/* ── Full-screen map area — sidebar floats over it ── */}
      <div className="relative flex-1 min-h-0">
        {/* Zoom-control positioning fix: nudge the relocated bottom-right
            zoom buttons up above the LiveInfoOverlay bar so they don't
            visually collide with it. Adjust the margin-bottom value below
            if your overlay's height changes. */}
        <style>{`
          .tracking-zoom-fix .leaflet-bottom.leaflet-right {
            margin-bottom: 118px;
          }
        `}</style>

        {/* Map — true edge-to-edge, no padding */}
        <div className="absolute inset-0 overflow-hidden tracking-zoom-fix">
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <MapFixer />
            <TileLayer
              key={mapMode}
              url={activeTile.url}
              attribution={activeTile.attribution}
            />

            {/* Relocated zoom control — was default top-left, hidden behind
                the floating device list panel. Now bottom-right. */}
            <ZoomControl position="bottomright" />

            {flyTarget && <FlyTo position={flyTarget} />}

            {route.length > 1 && (
              <Polyline
                positions={route}
                color="#2563eb"
                weight={4}
                opacity={0.7}
              />
            )}

            {allMarkers
              .filter((m) => m.id !== selectedId)
              .map((m) => (
                <Marker
                  key={m.id}
                  position={[m.lat, m.lng]}
                  icon={buildDotIcon(m.status)}
                  eventHandlers={{
                    click: () => {
                      setSelectedId(m.id);
                      setCollapsed(true);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-bold">{m.name}</div>
                    <div className="text-xs text-slate-500">
                      {m.status} · {m.speed} km/h
                    </div>
                  </Popup>
                </Marker>
              ))}

            {selectedVehicle && (
              <TruckMarker
                position={renderedPos}
                bearing={bearing}
                vehicle={selectedVehicle}
                liveData={liveData}
              />
            )}
          </MapContainer>

          {/* Live info overlay — anchored to the map bottom */}
          <LiveInfoOverlay vehicle={selectedVehicle} liveData={liveData} />

          {/* No vehicle selected prompt */}
          {!selectedVehicle && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-[800]">
              <div className="text-center">
                <Truck size={36} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">
                  Select a vehicle to track
                </p>
              </div>
            </div>
          )}
        </div>

        <MapStyleControl
          value={mapMode}
          onChange={setMapMode}
          className="absolute top-3 right-3 z-[1001]"
        />

        {/* ── Floating LEFT sidebar — overlays the map ── */}
        <div
          className={cn(
            "absolute left-3 top-3 bottom-3 z-[1001] transition-all duration-300",
            collapsed ? "w-10" : "w-72",
          )}
        >
          <DeviceListPanel
            vehicles={vehicles}
            loading={isLoading}
            selectedId={selectedId}
            onSelect={(v) => {
              setSelectedId(v.id);
              setCollapsed(true);
            }}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        </div>
      </div>
    </div>
  );
}