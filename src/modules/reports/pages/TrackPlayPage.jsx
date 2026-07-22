/**
 * TrackPlayPage.jsx — New-Ausprey
 *
 * Historical track playback — mirrors old Ausprey LeafletControlsMap:
 *  - Collapsible left control panel: vehicle select, date range, quick selects
 *  - Leaflet map with route polyline, START/END markers, directional arrows
 *  - Smooth rAF-based truck marker animation between GPS points
 *  - Playback controls: Play / Pause / Resume / Stop + speed slider (0.25x–4x)
 *  - Status filter toggles (Motion / Stop / Idle)
 *  - Collapsible history list (click to jump to point)
 *  - Right info panel: vehicle header, trip summary, live playback stats + progress
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-polylinedecorator";
import "leaflet-geometryutil";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  Calendar,
  Truck,
  Clock,
  MapPin,
  Gauge,
  Activity,
  ChevronDown,
} from "lucide-react";
import { useAccountStore } from "@/store";
import apiService from "@/services/apiService";
import { MapStyleControl } from "@/components/maps";
import { MAP_MODES, DEFAULT_MAP_MODE } from "@/utils/mapTiles";
import { cn } from "@/utils";

// ─── Leaflet default icon fix ─────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Animation helpers ────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const lerpAngle = (a, b, t) => {
  const diff = ((b - a + 540) % 360) - 180;
  return a + diff * t;
};
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

// Bearing between two [lat,lng] points (fallback if GeometryUtil unavailable)
const calcBearing = (fromLat, fromLng, toLat, toLng) => {
  if (L.GeometryUtil?.bearing) {
    return L.GeometryUtil.bearing(
      L.latLng(fromLat, fromLng),
      L.latLng(toLat, toLng),
    );
  }
  const φ1 = (fromLat * Math.PI) / 180,
    φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const pad = (n) => String(n).padStart(2, "0");
const fmtTs = (input) => {
  const d = new Date(input);
  if (isNaN(d)) return input ?? "—";
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// Truck icon (same flaticon as live tracking, faces upper-right → offset 125)
const TRUCK_ICON_URL =
  "https://cdn-icons-png.flaticon.com/512/1048/1048329.png";
const ICON_OFFSET = 125;
const truckIcon = (status, bearing) =>
  L.divIcon({
    className: "trackplay-truck",
    html: `<div style="
    width:38px;height:38px;
    transform:rotate(${bearing}deg);
    transform-origin:center center;
    display:flex;align-items:center;justify-content:center;
    filter:drop-shadow(0 3px 4px rgba(0,0,0,.4));
  "><img src="${TRUCK_ICON_URL}" style="width:80%;height:80%" /></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

const START_ICON = L.divIcon({
  html: `<div style="background:#10b981;color:#fff;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.3);white-space:nowrap">START</div>`,
  className: "",
  iconSize: [60, 24],
  iconAnchor: [30, 24],
});
const END_ICON = L.divIcon({
  html: `<div style="background:#ef4444;color:#fff;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.3);white-space:nowrap">END</div>`,
  className: "",
  iconSize: [50, 24],
  iconAnchor: [25, 24],
});

const STATUS_TYPES = ["MOTION", "STOP", "IDLE"];
const statusStyle = (s) =>
  s === "MOTION"
    ? { bg: "#ecfdf5", text: "#047857" }
    : s === "STOP"
      ? { bg: "#fef2f2", text: "#b91c1c" }
      : { bg: "#fffbeb", text: "#b45309" };

const QUICK = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "7 Days" },
];

// ─── Searchable vehicle dropdown ──────────────────────────────────────────────
function VehicleSelect({ options, value, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl border bg-white text-left transition",
          open
            ? "border-primary ring-2 ring-primary/20"
            : "border-slate-200 hover:border-slate-300",
        )}
      >
        {loading ? (
          <span className="text-slate-400 flex-1">Loading…</span>
        ) : selected ? (
          <span className="text-slate-700 flex-1 truncate">
            {selected.label}
          </span>
        ) : (
          <span className="text-slate-400 flex-1">Search IMEI / Vehicle…</span>
        )}
        <ChevronDown
          size={15}
          className={cn(
            "text-slate-400 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="absolute z-[1200] left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400 text-center">
                No matches
              </p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value, o);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition",
                    o.value === value
                      ? "bg-primary/5 text-primary font-semibold"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bottom info bar stat cells ───────────────────────────────────────────────
function BottomStat({
  icon: Icon,
  label,
  value,
  iconColor = "text-slate-500",
  wide,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-2.5 border-r border-slate-100 last:border-r-0",
        wide ? "min-w-[150px]" : "min-w-[100px]",
      )}
    >
      <div className={cn("mb-0.5", iconColor)}>
        <Icon size={15} />
      </div>
      <div className="text-sm font-extrabold text-slate-900 leading-tight text-center whitespace-nowrap">
        {value ?? "—"}
      </div>
      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}

function BottomStatStatus({ status }) {
  const sc = statusStyle(status);
  const color =
    status === "MOTION"
      ? "text-emerald-500"
      : status === "STOP"
        ? "text-rose-500"
        : status === "IDLE"
          ? "text-amber-500"
          : "text-slate-400";
  return (
    <div className="flex flex-col items-center justify-center px-4 py-2.5 border-r border-slate-100 min-w-[100px]">
      <div className={cn("mb-0.5", color)}>
        <Activity size={15} />
      </div>
      <span
        className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold"
        style={{ background: sc.bg, color: sc.text }}
      >
        {status}
      </span>
      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
        Status
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TrackPlayPage() {
  const accid = useAccountStore((s) => s.selectedAccount?.id ?? 1);

  // Refs — map / layers / animation
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);
  const rafRef = useRef(null);
  const idxRef = useRef(0);
  const pathRef = useRef({
    line: null,
    decorator: null,
    startMarker: null,
    endMarker: null,
  });
  const pointMarkersRef = useRef([]);
  const followRef = useRef(true); // mirror of `follow` for use inside rAF loop

  // State
  const [vehicleList, setVehicleList] = useState([]);
  const [vehLoading, setVehLoading] = useState(false);
  const [selectedVeh, setSelectedVeh] = useState(null); // { value, label }
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [quick, setQuick] = useState(null);

  const [vehicleData, setVehicleData] = useState([]); // full point array
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState(["MOTION", "STOP", "IDLE"]);
  const [speed, setSpeed] = useState(1);
  const [follow, setFollow] = useState(true); // follow-vehicle mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(null);
  const [playInfo, setPlayInfo] = useState(null);
  const [mapMode, setMapMode] = useState(DEFAULT_MAP_MODE);

  // Keep followRef in sync so the animation loop reads the latest value
  useEffect(() => {
    followRef.current = follow;
  }, [follow]);

  // ── Load vehicle list ──
  useEffect(() => {
    setVehLoading(true);
    apiService
      .getImeiDropdown(accid)
      .then((list) => {
        const opts = list
          .map((v) => ({
            value: v.imei,
            label: v.vehnum ? `${v.vehnum} (${v.imei})` : v.imei,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setVehicleList(opts);
        setVehLoading(false);
      })
      .catch(() => setVehLoading(false));
  }, [accid]);

  // ── Map init (once) ──
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map("trackplay-map", {
      center: [22.5589, 75.6089],
      zoom: 5,
      zoomControl: false,
    });
    tileLayerRef.current = L.tileLayer(MAP_MODES[DEFAULT_MAP_MODE].url, {
      attribution: "© OpenStreetMap",
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale().addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      stopAnimation();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap tile layer when the style mode changes
  useEffect(() => {
    tileLayerRef.current?.setUrl(MAP_MODES[mapMode].url);
  }, [mapMode]);

  // Invalidate size when panel toggles
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 320);
    return () => clearTimeout(t);
  }, [panelOpen]);

  // ── Filtered data by status + date ──
  const filteredData = useMemo(() => {
    const from = fromDate ? new Date(fromDate).getTime() : null;
    const to = toDate ? new Date(toDate).getTime() : null;
    return vehicleData.filter((r) => {
      const ts = new Date(r.ts).getTime();
      const dateOk = (!from || ts >= from) && (!to || ts <= to);
      return dateOk && statusFilter.includes(r.status);
    });
  }, [vehicleData, fromDate, toDate, statusFilter]);

  // ── Stop & reset animation ──
  const stopAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    idxRef.current = 0;
    setIsPlaying(false);
    setIsPaused(false);
    setHighlightIdx(null);
    setPlayInfo(null);
  }, []);

  // ── Quick date select ──
  const handleQuick = (type) => {
    setQuick(type);
    const now = new Date();
    now.setSeconds(0, 0);
    let s = new Date(),
      e = new Date();
    if (type === "today") {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
    }
    if (type === "yesterday") {
      s.setDate(now.getDate() - 1);
      s.setHours(0, 0, 0, 0);
      e.setDate(now.getDate() - 1);
      e.setHours(23, 59, 59, 999);
    }
    if (type === "week") {
      s.setDate(now.getDate() - 7);
    }
    const fmt = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFromDate(fmt(s));
    setToDate(fmt(e));
  };

  // ── Fetch track data ──
  const handleSubmit = async () => {
    setError("");
    if (!selectedVeh?.value) {
      setError("Please select a vehicle.");
      return;
    }
    if (!fromDate || !toDate) {
      setError("Please select both From and To dates.");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From date cannot be after To date.");
      return;
    }

    setLoading(true);
    setShowHistory(false);
    setVehicleData([]);
    setStatusFilter(["MOTION", "STOP", "IDLE"]);
    stopAnimation();
    clearMapLayers();

    try {
      const points = await apiService.getTrackPlayHistory({
        imei: selectedVeh.value,
        startTime: new Date(fromDate).toISOString(),
        endTime: new Date(toDate).toISOString(),
      });
      if (!points.length) {
        setError("No track data found for the selected period.");
        return;
      }
      const sorted = [...points].sort(
        (a, b) => new Date(a.ts) - new Date(b.ts),
      );
      setVehicleData(sorted);
      setShowHistory(true);
    } catch (e) {
      setError("Failed to load track data.");
    } finally {
      setLoading(false);
    }
  };

  // ── Clear all map layers ──
  const clearMapLayers = () => {
    layerRef.current?.clearLayers();
    pathRef.current = {
      line: null,
      decorator: null,
      startMarker: null,
      endMarker: null,
    };
    pointMarkersRef.current = [];
  };

  // ── Draw static path + point markers when data/filter changes ──
  useEffect(() => {
    const map = mapRef.current,
      layer = layerRef.current;
    if (!map || !layer || !showHistory || vehicleData.length === 0) return;

    // If animation is active, don't redraw point markers (avoids flicker)
    const animActive = !!rafRef.current || isPaused;

    layer.clearLayers();

    // Build polyline from full dataset
    const valid = vehicleData
      .map((r) => [Number(r.lat), Number(r.lng), r])
      .filter(
        ([lat, lng]) =>
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180,
      );

    if (valid.length < 2) return;

    const latLngs = valid.map(([lat, lng]) => [lat, lng]);
    const line = L.polyline(latLngs, {
      color: "#2563eb",
      weight: 4,
      opacity: 0.85,
    }).addTo(layer);

    // Directional arrows
    let decorator = null;
    if (L.polylineDecorator && L.Symbol?.arrowHead) {
      decorator = L.polylineDecorator(line, {
        patterns: [
          {
            offset: "5%",
            repeat: "12%",
            symbol: L.Symbol.arrowHead({
              pixelSize: 10,
              headAngle: 50,
              polygon: false,
              pathOptions: { color: "#2563eb", weight: 2 },
            }),
          },
        ],
      }).addTo(layer);
    }

    const startMarker = L.marker(latLngs[0], { icon: START_ICON }).addTo(layer);
    const endMarker = L.marker(latLngs[latLngs.length - 1], {
      icon: END_ICON,
    }).addTo(layer);
    pathRef.current = { line, decorator, startMarker, endMarker };

    if (!animActive) {
      map.fitBounds(line.getBounds(), { padding: [50, 50] });
      // Draw only STOP / IDLE markers — MOTION points cover the whole
      // polyline (vehicle moves continuously) and hide the route line.
      filteredData.forEach((rec) => {
        if (rec.status === "MOTION") return;
        const lat = Number(rec.lat),
          lng = Number(rec.lng);
        if (isNaN(lat) || isNaN(lng)) return;
        const st = statusStyle(rec.status);
        const m = L.circleMarker([lat, lng], {
          radius: 5,
          color: "#fff",
          weight: 1.5,
          fillColor: st.text,
          fillOpacity: 0.9,
        }).bindTooltip(
          `${fmtTs(rec.ts)}<br>${rec.status} · ${rec.speed ?? 0} km/h`,
        );
        m.addTo(layer);
        pointMarkersRef.current.push(m);
      });
    } else if (markerRef.current) {
      markerRef.current.addTo(layer);
    }
  }, [vehicleData, filteredData, showHistory, isPaused]);

  // ── Animation engine ──
  const animateSegment = useCallback(
    (points, idx, segDuration) => {
      const fromPt = points[idx],
        toPt = points[idx + 1];
      const fromLat = +fromPt.lat,
        fromLng = +fromPt.lng;
      const toLat = +toPt.lat,
        toLng = +toPt.lng;

      const fromBearing =
        idx > 0
          ? calcBearing(
              +points[idx - 1].lat,
              +points[idx - 1].lng,
              fromLat,
              fromLng,
            )
          : 0;
      const toBearing = calcBearing(fromLat, fromLng, toLat, toLng);

      const start = performance.now();
      const frame = (now) => {
        const m = markerRef.current,
          map = mapRef.current;
        if (!m || !map) return;
        const t = Math.min((now - start) / segDuration, 1);
        const e = easeInOut(t);
        const lat = lerp(fromLat, toLat, e);
        const lng = lerp(fromLng, toLng, e);
        const bearing = lerpAngle(fromBearing, toBearing, e);

        m.setLatLng([lat, lng]);
        m.setIcon(truckIcon(toPt.status, bearing - ICON_OFFSET));

        // Follow the vehicle: keep it centered on every frame while follow mode is on.
        // setView with animate:false avoids stacking animations (smooth + no jitter).
        if (followRef.current) {
          map.setView([lat, lng], map.getZoom(), { animate: false });
        }

        setHighlightIdx(idx);
        setPlayInfo(toPt);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(frame);
        } else {
          idxRef.current = idx + 1;
          if (idxRef.current >= points.length - 1) {
            setHighlightIdx(points.length - 1);
            stopAnimation();
            return;
          }
          animateSegment(points, idxRef.current, segDuration);
        }
      };
      rafRef.current = requestAnimationFrame(frame);
    },
    [stopAnimation],
  );

  const startAnimation = useCallback(() => {
    const map = mapRef.current,
      layer = layerRef.current;
    if (!map || vehicleData.length < 2) {
      setError("Track data not ready.");
      return;
    }

    setIsPaused(false);
    setIsPlaying(true);

    const points = vehicleData;
    const startIdx =
      idxRef.current > 0 && idxRef.current < points.length - 1
        ? idxRef.current
        : 0;
    idxRef.current = startIdx;

    // Create marker if missing
    if (!markerRef.current) {
      const p = points[startIdx];
      markerRef.current = L.marker([+p.lat, +p.lng], {
        icon: truckIcon(p.status, 0),
      }).addTo(layer);
    } else {
      markerRef.current.addTo(layer);
    }

    // When following, zoom in on the vehicle's current position so the
    // continuous re-centering is meaningful (closer street-level view).
    if (followRef.current) {
      const p = points[startIdx];
      const targetZoom = Math.max(map.getZoom(), 15);
      map.setView([+p.lat, +p.lng], targetZoom, { animate: true });
    }

    const segDuration = Math.max(50, 600 / speed);
    animateSegment(points, startIdx, segDuration);
  }, [vehicleData, speed, animateSegment]);

  // ── Play / Pause / Resume toggle ──
  const togglePlay = () => {
    if (rafRef.current && !isPaused) {
      // Pause
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setIsPaused(true);
      setIsPlaying(false);
    } else if (isPaused) {
      startAnimation(); // Resume from idxRef
    } else {
      idxRef.current = 0; // Start fresh
      startAnimation();
    }
  };

  // Restart speed: cancel current loop so next play uses new speed
  const handleSpeed = (v) => {
    setSpeed(v);
    if (rafRef.current && !isPaused) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const toggleStatus = (type) => {
    setHighlightIdx(null);
    setStatusFilter((prev) => {
      const next = prev.includes(type)
        ? prev.filter((s) => s !== type)
        : [...prev, type];
      if (next.length === 0) {
        setError("At least one status must stay active.");
        return prev;
      }
      setError("");
      return next;
    });
  };

  const progressPct =
    highlightIdx !== null && vehicleData.length > 1
      ? Math.round((highlightIdx / (vehicleData.length - 1)) * 100)
      : 0;

  const playing = isPlaying && !isPaused;

  return (
    <div className="relative h-[calc(100vh-180px)] min-h-[600px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
      {/* Panel toggle */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="absolute top-3 z-[1100] w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg transition-all hover:bg-slate-700"
        style={{ left: panelOpen ? 312 : 12 }}
      >
        {panelOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* ── Left control panel ── */}
      <div
        className={cn(
          "absolute top-0 left-0 h-full bg-white z-[900] overflow-y-auto border-r border-slate-200 shadow-lg transition-transform duration-300",
          panelOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ width: 300 }}
      >
        <div className="p-4">
          <h3 className="text-sm font-bold text-primary mb-4">
            Track Play Controls
          </h3>

          {/* Vehicle */}
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            Select Vehicle
          </label>
          <div className="mb-4">
            <VehicleSelect
              options={vehicleList}
              value={selectedVeh?.value}
              loading={vehLoading}
              onChange={(_, o) => {
                setSelectedVeh(o);
                setShowHistory(false);
                stopAnimation();
                setStatusFilter(["MOTION", "STOP", "IDLE"]);
              }}
            />
          </div>

          {/* Dates */}
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            Date / Time Range
          </label>
          <div className="space-y-2 mb-3">
            <div>
              <span className="text-[11px] text-slate-400">From</span>
              <input
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">To</span>
              <input
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Quick selects */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {QUICK.map((q) => (
              <button
                key={q.key}
                onClick={() => handleQuick(q.key)}
                className={cn(
                  "py-1.5 text-xs font-bold rounded-lg border transition",
                  quick === q.key
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-500 border-slate-200 hover:border-primary",
                )}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedVeh || !fromDate || !toDate}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-bold transition mb-3",
              loading || !selectedVeh
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover",
            )}
          >
            {loading ? "Loading…" : "Get Track Data"}
          </button>

          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          {/* Playback controls */}
          {showHistory && filteredData.length > 0 && (
            <>
              {/* Status filter */}
              <p className="text-xs font-bold text-slate-600 mb-2">
                Filter Status
              </p>
              <div className="flex justify-between mb-4">
                {STATUS_TYPES.map((type) => {
                  const on = statusFilter.includes(type);
                  return (
                    <div
                      key={type}
                      className="flex flex-col items-center gap-1"
                    >
                      <span className="text-[11px] text-slate-500">{type}</span>
                      <button
                        onClick={() => toggleStatus(type)}
                        className={cn(
                          "relative w-10 h-[22px] rounded-full transition",
                          on ? "bg-emerald-500" : "bg-slate-300",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white transition-all",
                            on ? "left-[20px]" : "left-0.5",
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Speed */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-600">
                    Playback Speed
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {speed}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.25}
                  max={4}
                  step={0.25}
                  value={speed}
                  onChange={(e) => handleSpeed(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0.25x</span>
                  <span>1x</span>
                  <span>2x</span>
                  <span>4x</span>
                </div>
              </div>

              {/* Follow vehicle toggle */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-600">
                  Follow Vehicle
                </span>
                <button
                  onClick={() => setFollow((v) => !v)}
                  className={cn(
                    "relative w-10 h-[22px] rounded-full transition",
                    follow ? "bg-primary" : "bg-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white transition-all",
                      follow ? "left-[20px]" : "left-0.5",
                    )}
                  />
                </button>
              </div>

              {/* Play / Stop */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={togglePlay}
                  disabled={vehicleData.length < 2}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition",
                    playing
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-emerald-500 hover:bg-emerald-600",
                  )}
                >
                  {playing ? (
                    <>
                      <Pause size={14} /> Pause
                    </>
                  ) : isPaused ? (
                    <>
                      <Play size={14} /> Resume
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Play
                    </>
                  )}
                </button>
                <button
                  onClick={stopAnimation}
                  disabled={!rafRef.current && !isPaused}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Square size={13} /> Stop
                </button>
              </div>

              {/* History list */}
              <button
                onClick={() => setListOpen((v) => !v)}
                className="text-xs font-bold text-primary mb-2 hover:underline"
              >
                {listOpen ? "Hide" : "Show"} History ({filteredData.length})
              </button>
              {listOpen && (
                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-lg mb-2">
                  {filteredData.map((rec, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setHighlightIdx(i);
                        if (rec.lat && rec.lng)
                          mapRef.current?.setView([+rec.lat, +rec.lng], 16, {
                            animate: true,
                          });
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-[11px] border-b border-slate-50 transition",
                        i === highlightIdx ? "bg-cyan-50" : "hover:bg-slate-50",
                      )}
                    >
                      <span className="text-slate-600">{fmtTs(rec.ts)}</span>
                      <span className="text-slate-400">
                        {" "}
                        — {rec.status} @ {rec.speed ?? 0} km/h
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Map ── */}
      <div
        id="trackplay-map"
        className="h-full w-full transition-all duration-300"
        style={{
          marginLeft: panelOpen ? 300 : 0,
          width: panelOpen ? "calc(100% - 300px)" : "100%",
        }}
      />

      <MapStyleControl
        value={mapMode}
        onChange={setMapMode}
        className="absolute top-20 right-3 z-[1000]"
      />

      {/* ── Bottom info bar (horizontal, like live tracking) ── */}
      {showHistory && filteredData.length > 0 && (
        <div
          className="absolute bottom-0 right-0 z-[1000] bg-white/97 backdrop-blur border-t border-slate-200 shadow-lg transition-all duration-300"
          style={{ left: panelOpen ? 300 : 0 }}
        >
          {/* Top strip: vehicle name + trip range + progress */}
          <div className="flex items-center gap-3 px-4 py-1.5 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                <Truck size={12} className="text-white" />
              </div>
              <span className="text-sm font-extrabold text-slate-900">
                {selectedVeh?.label ?? "—"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  playing ? "bg-emerald-500 animate-pulse" : "bg-slate-300",
                )}
              />
              <span className="font-semibold">
                {playing ? "Live Playback" : isPaused ? "Paused" : "Playback"}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0 min-w-[180px]">
              <span className="text-[11px] text-slate-500 font-medium">
                {progressPct}%
              </span>
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden min-w-[100px]">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">
                {filteredData.length}/{vehicleData.length}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-stretch overflow-x-auto">
            <BottomStat
              icon={Gauge}
              label="Speed"
              value={`${playInfo?.speed ?? vehicleData[0]?.speed ?? 0} km/h`}
              iconColor="text-blue-500"
            />

            <BottomStatStatus
              status={playInfo?.status ?? vehicleData[0]?.status ?? "—"}
            />

            <BottomStat
              icon={Clock}
              label="Timestamp"
              value={playInfo?.ts ? fmtTs(playInfo.ts) : "—"}
              iconColor="text-slate-500"
              wide
            />

            <BottomStat
              icon={MapPin}
              label="Latitude"
              value={playInfo?.lat ? (+playInfo.lat).toFixed(5) : "—"}
              iconColor="text-emerald-500"
            />

            <BottomStat
              icon={MapPin}
              label="Longitude"
              value={playInfo?.lng ? (+playInfo.lng).toFixed(5) : "—"}
              iconColor="text-emerald-500"
            />

            <BottomStat
              icon={Clock}
              label="From"
              value={fromDate ? new Date(fromDate).toLocaleString() : "—"}
              iconColor="text-slate-500"
              wide
            />

            <BottomStat
              icon={Clock}
              label="To"
              value={toDate ? new Date(toDate).toLocaleString() : "—"}
              iconColor="text-slate-500"
              wide
            />
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div
          className="absolute inset-0 z-[1050] flex items-center justify-center bg-white/50 backdrop-blur-sm"
          style={{ marginLeft: panelOpen ? 300 : 0 }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-500 font-medium">
              Loading track data…
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
