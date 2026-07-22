/**
 * VehicleDrawer.jsx — New-Ausprey Dashboard
 *
 * A slide-in drawer that opens when a vehicle row is clicked in the
 * FleetTableCard. Shows:
 *
 *   • Header  — vehicle number, IMEI, account, status chip, "Open in Tracking" link
 *   • Live stats strip — speed, ignition, GPS, battery, odometer, bearing
 *   • Mini-map  — Leaflet tile with a single truck marker + 10-min route line
 *   • Recent alerts — last 5 alerts for this vehicle from db-alerts
 *   • Polls getLiveTrack every 30 s to keep stats fresh
 *
 * Props:
 *   vehicle  { imei, accid, vehnum, name, accountName, _status, ...rawFields }
 *   onClose  () => void
 */
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Navigation,
  Gauge,
  Zap,
  Battery,
  RotateCcw,
  Activity,
  MapPin,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui";
import { MapStyleControl } from "@/components/maps";
import { MAP_MODES, DEFAULT_MAP_MODE } from "@/utils/mapTiles";
import { cn } from "@/utils";
import apiService from "@/services/apiService";
import { PATHS } from "@/constants";

// ─── Leaflet icon fix ─────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TRUCK_ICON_URL =
  "https://cdn-icons-png.flaticon.com/512/1048/1048329.png";

function truckIcon(bearing = 0) {
  return L.divIcon({
    className: "vd-truck",
    html: `<div style="
      width:36px;height:36px;
      transform:rotate(${bearing - 135}deg);
      transform-origin:center;
      filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));
      display:flex;align-items:center;justify-content:center;">
      <img src="${TRUCK_ICON_URL}" style="width:80%;height:80%"/>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// ─── Map auto-fit helper ──────────────────────────────────────────────────────
function MapFit({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 15, { animate: true });
  }, [map, position?.[0], position?.[1]]);
  return null;
}

// ─── Stat cell ────────────────────────────────────────────────────────────────
function Stat({ icon: Icon, label, value, color = "text-slate-400", loading }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-3 py-2.5
                    border-r border-slate-100 last:border-r-0 min-w-[80px]"
    >
      <Icon size={14} className={cn("mb-0.5", color)} />
      {loading ? (
        <Skeleton className="h-4 w-12 mt-0.5" />
      ) : (
        <div className="text-sm font-extrabold text-slate-900 leading-tight text-center">
          {value ?? "—"}
        </div>
      )}
      <div className="text-[10px] text-slate-500 font-semibold mt-0.5 whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

// ─── Alert type metadata ──────────────────────────────────────────────────────
const ALERT_COLOR = {
  BAT: "#f59e0b",
  HAR: "#ef4444",
  HBR: "#e11d48",
  OVS: "#8b5cf6",
  SOS: "#dc2626",
  IGN: "#10b981",
  GEO: "#0ea5e9",
  IDL: "#f97316",
  TOW: "#6366f1",
};
const alertColor = (t) => ALERT_COLOR[t] ?? "#94a3b8";
const alertLabel = (t) =>
  ({
    BAT: "Battery",
    HAR: "Harsh Accel",
    HBR: "Harsh Brake",
    OVS: "Overspeed",
    SOS: "SOS",
    IGN: "Ignition",
    GEO: "Geofence",
    IDL: "Idle",
    TOW: "Tow",
  })[t] ?? t;

const fmtTs = (s) => {
  if (!s) return "—";
  const d = new Date((s ?? "").toString().replace(" ", "T"));
  if (isNaN(d)) return s;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Status chip ──────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  motion: {
    bg: "bg-emerald-50 text-emerald-600",
    dot: "bg-emerald-500",
    label: "Motion",
  },
  idle: {
    bg: "bg-amber-50 text-amber-600",
    dot: "bg-amber-400",
    label: "Idle",
  },
  stopped: {
    bg: "bg-rose-50 text-rose-600",
    dot: "bg-rose-500",
    label: "Stopped",
  },
  offline: {
    bg: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
    label: "Offline",
  },
};
function StatusChip({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.offline;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold",
        s.bg,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────
export function VehicleDrawer({ vehicle, onClose }) {
  const navigate = useNavigate();

  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoad, setAlertsLoad] = useState(true);
  const [route, setRoute] = useState([]); // [lat,lng] list for mini-map polyline
  const [refreshTs, setRefreshTs] = useState(null);
  const [mapMode, setMapMode] = useState(DEFAULT_MAP_MODE);
  const activeTile = MAP_MODES[mapMode];

  const timerRef = useRef(null);

  // ── Fetch live stats ─────────────────────────────────────────────────────────
  const fetchLive = useCallback(async () => {
    if (!vehicle?.imei) return;
    try {
      const res = await apiService.getLiveTrack(
        vehicle.accid ?? vehicle.accountId ?? 1,
        vehicle.imei,
      );
      if (res?.resultCode === 1 && res?.data) {
        setLiveData(res.data);
        setRefreshTs(new Date());
        // Accumulate route — keep last 20 points
        const lat = Number(res.data.lat ?? res.data.latitude ?? vehicle.lat);
        const lng = Number(res.data.lng ?? res.data.longitude ?? vehicle.lng);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          setRoute((prev) => {
            const next = [...prev, [lat, lng]];
            return next.slice(-20);
          });
        }
      }
    } catch {
      /* silent */
    } finally {
      setLiveLoading(false);
    }
  }, [vehicle]);

  // ── Fetch recent alerts from db-alerts (filtered to this IMEI) ───────────────
  const fetchAlerts = useCallback(async () => {
    if (!vehicle?.accid) {
      setAlertsLoad(false);
      return;
    }
    try {
      const res = await apiService.getDbAlerts(vehicle.accid);
      if (res?.data?.resultCode === 1) {
        const all = res.data.data?.data ?? [];
        const mine = all
          .filter((a) => a.imei === vehicle.imei)
          .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
          .slice(0, 5);
        setAlerts(mine);
      }
    } catch {
      /* silent */
    } finally {
      setAlertsLoad(false);
    }
  }, [vehicle]);

  // Seed route with the snapshot position we already have from the VTS data
  useEffect(() => {
    const lat = Number(vehicle?.lat ?? 0);
    const lng = Number(vehicle?.lng ?? 0);
    if (lat && lng) setRoute([[lat, lng]]);
  }, [vehicle?.imei]);

  // Initial fetches + 30 s live poll
  useEffect(() => {
    fetchLive();
    fetchAlerts();
    timerRef.current = setInterval(fetchLive, 30_000);
    return () => clearInterval(timerRef.current);
  }, [fetchLive, fetchAlerts]);

  // Close on Escape
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ── Derived display values ───────────────────────────────────────────────────
  const d = liveData ?? {};
  const vehName = d.vehnum ?? vehicle?.vehnum ?? vehicle?.name ?? "—";
  const imei = vehicle?.imei ?? "—";
  const status = vehicle?._status ?? "offline";
  const speed = Number(d.speed ?? vehicle?.speed ?? 0);
  const ign = (d.ign ?? vehicle?.ign ?? "N").toUpperCase();
  const gps = (d.gps ?? vehicle?.gps ?? "").toUpperCase();
  const bearing = d.disha != null ? Number(d.disha) : null;
  const battery = d.misc?.batteryPercentage ?? d.batAmp ?? d.battery ?? null;
  const odometer = d.misc?.odometer
    ? `${Number(d.misc.odometer).toLocaleString()} km`
    : d.odoMeter
      ? `${Number(d.odoMeter).toLocaleString()} km`
      : "—";
  const address = d.address ?? vehicle?.address ?? "—";
  const updated = d.devTs ?? d.cts ?? vehicle?.devTs ?? vehicle?.cts ?? "—";
  const distance = Number(d.distance ?? 0).toFixed(1);

  const markerPos = route.length
    ? route[route.length - 1]
    : vehicle?.lat && vehicle?.lng
      ? [Number(vehicle.lat), Number(vehicle.lng)]
      : null;

  const openInTracking = () => {
    onClose();
    navigate(PATHS.TRACKING, {
      state: { targetImei: imei, targetAccountId: vehicle?.accid },
    });
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9990] bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[9991] w-full max-w-[420px] bg-white
                      shadow-2xl flex flex-col overflow-hidden animate-slide-in-right"
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between px-4 py-3
                        bg-gradient-to-r from-slate-800 to-slate-900 text-white shrink-0"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/80 flex items-center justify-center shrink-0">
                <Navigation size={14} className="text-white" />
              </div>
              <span className="text-base font-extrabold truncate">
                {vehName}
              </span>
              <StatusChip status={status} />
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{imei}</div>
            {vehicle?.accountName && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                {vehicle.accountName}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={openInTracking}
              title="Open in Live Tracking"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10
                         hover:bg-white/20 text-xs font-semibold transition"
            >
              <ExternalLink size={12} /> Track
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Live stats strip ── */}
          <div className="bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Live telemetry
              </span>
              <div className="flex items-center gap-2">
                {refreshTs && (
                  <span className="text-[10px] text-slate-400">
                    {refreshTs.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                <button
                  onClick={() => {
                    setLiveLoading(true);
                    fetchLive();
                  }}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 transition"
                >
                  <RefreshCw
                    size={11}
                    className={cn(liveLoading && "animate-spin")}
                  />
                </button>
              </div>
            </div>
            <div className="flex overflow-x-auto pb-2">
              <Stat
                icon={Gauge}
                label="Speed"
                value={`${speed} km/h`}
                color="text-blue-500"
                loading={liveLoading}
              />
              <Stat
                icon={Zap}
                label="Ignition"
                value={ign === "Y" ? "ON" : "OFF"}
                color={ign === "Y" ? "text-emerald-500" : "text-rose-400"}
                loading={liveLoading}
              />
              <Stat
                icon={Activity}
                label="GPS"
                value={gps === "A" ? "Active" : "No fix"}
                color={gps === "A" ? "text-emerald-500" : "text-slate-400"}
                loading={liveLoading}
              />
              <Stat
                icon={Battery}
                label="Battery"
                value={battery != null ? `${battery} V` : "—"}
                color="text-amber-500"
                loading={liveLoading}
              />
              <Stat
                icon={RotateCcw}
                label="Odometer"
                value={odometer}
                color="text-purple-500"
                loading={liveLoading}
              />
              <Stat
                icon={Navigation}
                label="Bearing"
                value={bearing != null ? `${bearing}°` : "—"}
                color="text-slate-400"
                loading={liveLoading}
              />
              <Stat
                icon={Navigation}
                label="Distance"
                value={`${distance} km`}
                color="text-emerald-500"
                loading={liveLoading}
              />
            </div>
          </div>

          {/* ── Address strip ── */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs">
            <MapPin size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-600 line-clamp-2 flex-1">
              {address}
            </span>
            <span className="text-slate-400 whitespace-nowrap shrink-0">
              {fmtTs(updated)}
            </span>
          </div>

          {/* ── Mini-map ── */}
          <div className="relative" style={{ height: 220 }}>
            {markerPos ? (
              <MapContainer
                center={markerPos}
                zoom={14}
                zoomControl={false}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  key={mapMode}
                  url={activeTile.url}
                  attribution={activeTile.attribution}
                />
                {route.length > 1 && (
                  <Polyline
                    positions={route}
                    color="#2563eb"
                    weight={3}
                    opacity={0.8}
                  />
                )}
                <Marker position={markerPos} icon={truckIcon(bearing ?? 0)} />
                <MapFit position={markerPos} />
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-100 text-slate-400 text-sm">
                <MapPin size={18} className="mr-2" /> No location data
              </div>
            )}
            <MapStyleControl
              value={mapMode}
              onChange={setMapMode}
              className="absolute top-2 left-2 z-[500]"
            />
            {/* Map overlay — open in Google Maps */}
            {markerPos && (
              <a
                href={`https://www.google.com/maps?q=${markerPos[0]},${markerPos[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 z-[500] flex items-center gap-1
                           bg-white/90 text-xs font-semibold text-slate-600 px-2 py-1
                           rounded-lg shadow border border-slate-200 hover:bg-white transition"
              >
                <ExternalLink size={11} /> Google Maps
              </a>
            )}
          </div>

          {/* ── Recent alerts ── */}
          <div className="px-4 pt-4 pb-6">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Recent alerts
            </h4>

            {alertsLoad ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex items-center gap-2 py-6 justify-center text-slate-400">
                <AlertTriangle size={16} className="text-slate-300" />
                <span className="text-sm">
                  No recent alerts for this vehicle.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div
                    key={a.id ?? i}
                    className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${alertColor(a.type)}1a` }}
                    >
                      <AlertTriangle
                        size={12}
                        style={{ color: alertColor(a.type) }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-xs font-bold"
                          style={{ color: alertColor(a.type) }}
                        >
                          {alertLabel(a.type)}
                        </span>
                        {Number(a.speed ?? 0) > 0 && (
                          <span className="text-[11px] text-slate-500 font-semibold shrink-0">
                            {a.speed} km/h
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400">
                        <Clock size={10} />
                        <span>{fmtTs(a.createdOn)}</span>
                      </div>
                      {a.address && (
                        <div className="flex items-start gap-1 mt-0.5 text-[11px] text-slate-500">
                          <MapPin size={10} className="shrink-0 mt-px" />
                          <span className="line-clamp-1">{a.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

export default VehicleDrawer;
