/**
 * TrackingPage.jsx — New-Ausprey
 *
 * Mirrors the old Ausprey LiveTrack page:
 *  - Left panel: searchable device list with status filter chips
 *  - Right: Leaflet map with live truck marker, route polyline, info overlay
 *  - Polls `getLiveTrack` every 30 s for the selected vehicle
 *  - Smooth marker animation between GPS fixes (like old project)
 *  - Route accumulation (last 100 points)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
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

import { PageHeader } from "@/components/common";
import { Card, Skeleton } from "@/components/ui";
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

const buildTruckIcon = (status, bearing, highlighted = false) => {
  const color = markerColor(status);
  const size = highlighted ? 40 : 32;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};border:2.5px solid #fff;
      border-radius:50%;
      box-shadow:0 3px 10px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      transform:rotate(${bearing - 90}deg);
      transition:transform 0.3s ease;
    ">
      <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white">
        <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

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

// ─── Left panel — device list ─────────────────────────────────────────────────

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

  if (collapsed) {
    return (
      <div className="flex flex-col items-center pt-4 gap-2">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
        >
          <ChevronRight size={18} className="text-slate-600" />
        </button>
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-800 rounded-t-2xl">
        <span className="text-sm font-bold text-white">
          Live Devices ({filtered.length})
        </span>
        <button
          onClick={onToggle}
          className="text-slate-300 hover:text-white transition"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-100">
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
                  onClick={() => onSelect(v)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 border-b border-slate-50 transition flex items-center gap-2.5",
                    isAct
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : "hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn("w-2 h-2 rounded-full shrink-0", meta.bg)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {v.name ?? v.id}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {v.lastUpdate ?? "—"}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                      meta.light,
                      meta.text,
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

// ─── Info overlay on map ──────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
        <Icon size={13} /> {label}
      </div>
      <span className="text-xs font-semibold text-slate-700 text-right max-w-[130px] truncate">
        {value ?? "—"}
      </span>
    </div>
  );
}

function LiveInfoOverlay({ vehicle, liveData }) {
  if (!vehicle) return null;
  const d = liveData ?? vehicle;
  return (
    <div className="absolute bottom-4 right-4 z-[900] w-64 bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
          <Truck size={15} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-extrabold text-slate-900">
            {d.vehnum ?? vehicle.name}
          </div>
          <div className="text-[11px] text-slate-400">
            {d.deviceType ?? vehicle.deviceType ?? "—"}
          </div>
        </div>
      </div>
      <InfoRow
        icon={Gauge}
        label="Speed"
        value={`${d.speed ?? vehicle.speed ?? 0} km/h`}
      />
      <InfoRow icon={Activity} label="Status" value={vehicle.status} />
      <InfoRow
        icon={Zap}
        label="Ignition"
        value={d.ign === "Y" ? "ON" : "OFF"}
      />
      <InfoRow
        icon={Navigation}
        label="Bearing"
        value={d.disha != null ? `${d.disha}°` : "—"}
      />
      <InfoRow
        icon={Battery}
        label="Battery"
        value={
          d.misc?.batteryPercentage ? `${d.misc.batteryPercentage} V` : "—"
        }
      />
      <InfoRow
        icon={Clock}
        label="Updated"
        value={d.devTs ?? d.cts ?? vehicle.lastUpdate}
      />
      <div className="mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-start gap-1.5">
          <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
          <span className="text-[11px] text-slate-500 leading-tight">
            {d.address ?? "—"}
          </span>
        </div>
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
  const [route, setRoute] = useState([]); // accumulated GPS trail
  const [animPos, setAnimPos] = useState(null); // smooth animated position
  const [bearing, setBearing] = useState(0);
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
    if (route.length) return route[route.length - 1];
    if (selectedVehicle?.lat) return [selectedVehicle.lat, selectedVehicle.lng];
    return [22.2587, 71.1924]; // Gujarat default
  }, [route, selectedVehicle]);

  // All vehicle markers (fleet overview dots)
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

  const TILE_URL =
    import.meta.env.VITE_MAP_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div>
      <PageHeader
        crumbs={["Home", "Live Tracking"]}
        title="Live Tracking"
        description="Real-time vehicle tracking with GPS telemetry."
        actions={
          <button
            onClick={fetchLive}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition"
          >
            <RotateCcw size={14} /> Refresh
          </button>
        }
      />

      <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[560px]">
        {/* ── Left panel ── */}
        <div
          className={cn(
            "transition-all duration-300 shrink-0",
            collapsed ? "w-10" : "w-72",
          )}
        >
          <DeviceListPanel
            vehicles={vehicles}
            loading={isLoading}
            selectedId={selectedId}
            onSelect={(v) => setSelectedId(v.id)}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        </div>

        {/* ── Map ── */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-card border border-slate-100">
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <MapFixer />
            <TileLayer
              url={TILE_URL}
              attribution="© OpenStreetMap contributors"
            />

            {/* Fly to selected vehicle's latest GPS fix */}
            {renderedPos && <FlyTo position={renderedPos} />}

            {/* Route polyline */}
            {route.length > 1 && (
              <Polyline
                positions={route}
                color="#2563eb"
                weight={4}
                opacity={0.7}
              />
            )}

            {/* All fleet vehicles as small dots */}
            {allMarkers
              .filter((m) => m.id !== selectedId)
              .map((m) => (
                <Marker
                  key={m.id}
                  position={[m.lat, m.lng]}
                  icon={L.divIcon({
                    className: "",
                    html: `<div style="width:12px;height:12px;background:${markerColor(m.status)};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.2)"></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6],
                  })}
                  eventHandlers={{ click: () => setSelectedId(m.id) }}
                >
                  <Popup>
                    <div className="text-xs font-bold">{m.name}</div>
                    <div className="text-xs text-slate-500">
                      {m.status} · {m.speed} km/h
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Selected vehicle — animated truck marker */}
            {selectedVehicle && renderedPos && (
              <Marker
                position={renderedPos}
                icon={buildTruckIcon(selectedVehicle.status, bearing, true)}
              >
                <Popup>
                  <div className="text-sm font-bold">
                    {selectedVehicle.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedVehicle.status} ·{" "}
                    {liveData?.speed ?? selectedVehicle.speed ?? 0} km/h
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Info overlay */}
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
      </div>
    </div>
  );
}
