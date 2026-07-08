/**
 * HourlyReportPage.jsx — New-Ausprey
 *
 * Working Hour / Hourly Report — mirrors old Ausprey HourlyReport page:
 *  - Account dropdown + IMEI dropdown (account-scoped)
 *  - Date range filter + quick selects (Today / Yesterday / Last 7 Days)
 *  - GET REPORT → POST /usage/reports/workinghourreport
 *  - Results table with sessions count, distance, duration, status
 *  - Session detail modal with Leaflet track playback
 *  - Account Summary Dashboard: KPI cards + sub-account table
 *  - Account Summary Charts: Top 10 bar + Fleet donut
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Sector,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  ChevronDown,
  X,
  Play,
  Pause,
  Truck,
  Clock,
  Map,
  Hash,
  Activity,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common";
import { Card, Skeleton, Spinner } from "@/components/ui";
import { useAccountStore } from "@/store";
import apiService from "@/services/apiService";
import { cn } from "@/utils";

// ─── Leaflet fix ──────────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => new Date().toISOString().slice(0, 10);

const toApiDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const fmtTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return v;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const fmtDuration = (v) => {
  if (!v) return "—";
  if (typeof v === "string" && v.includes(":")) return v;
  const mins = parseInt(v, 10);
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtSeconds = (s) => {
  if (!s) return "0m";
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const getQuickRange = (type) => {
  const t = todayStr();
  if (type === "today") return { start: t, end: t };
  if (type === "yesterday") {
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    return { start: y, end: y };
  }
  if (type === "last7")
    return {
      start: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      end: t,
    };
  return { start: t, end: t };
};

const flattenAccounts = (accounts) => {
  let flat = [];
  accounts.forEach((a) => {
    if (!a.childAccounts?.length) flat.push(a);
    else flat = [...flat, ...flattenAccounts(a.childAccounts)];
  });
  return flat;
};

// ─── Searchable dropdowns ─────────────────────────────────────────────────────
function SearchableSelect({
  options,
  value,
  onChange,
  loading,
  placeholder,
  label,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const selected = options.find((o) => (o.value ?? o.id) === value);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter((o) =>
    (o.label ?? o.accountName ?? "")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block text-xs font-bold text-slate-600 mb-1.5">
          {label}
        </label>
      )}
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
            {selected.label ?? selected.accountName}
          </span>
        ) : (
          <span className="text-slate-400 flex-1">{placeholder}</span>
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
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
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
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-400 text-center">
                No matches
              </p>
            ) : (
              filtered.map((o) => {
                const val = o.value ?? o.id;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      onChange(val, o);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-sm transition",
                      val === value
                        ? "bg-primary/5 text-primary font-semibold"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <div className="font-medium">
                      {o.label ?? o.accountName}
                    </div>
                    {o.id && o.accountName && (
                      <div className="text-xs text-slate-400">ID: {o.id}</div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Session Playback Map ─────────────────────────────────────────────────────
function FlyTo({ pos }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!pos) return;
    const key = pos.join(",");
    if (key === prev.current) return;
    prev.current = key;
    map.flyTo(pos, 14, { duration: 0.5 });
  }, [pos, map]);
  return null;
}

function SessionMap({ imei, session, isPlaying }) {
  const [route, setRoute] = useState([]);
  const [markerPos, setMarkerPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const idxRef = useRef(0);
  const ptsRef = useRef([]);

  useEffect(() => {
    if (!imei || !session?.startTime) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    idxRef.current = 0;
    setRoute([]);
    setMarkerPos(null);
    setProgress(0);
    setLoading(true);

    apiService
      .getTrackPlayHistory({
        imei,
        startTime: session.startTime,
        endTime: session.endTime,
      })
      .then((pts) => {
        ptsRef.current = pts;
        if (pts.length) {
          const latLngs = pts.map((p) => [p.lat, p.lng]);
          setRoute(latLngs);
          setMarkerPos(latLngs[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [imei, session]);

  useEffect(() => {
    if (!isPlaying || !ptsRef.current.length) return;
    const pts = ptsRef.current;
    const STEP_MS = 500;

    const step = () => {
      if (idxRef.current >= pts.length - 1) return;
      idxRef.current++;
      const p = pts[idxRef.current];
      setMarkerPos([p.lat, p.lng]);
      setProgress(Math.round((idxRef.current / (pts.length - 1)) * 100));
      rafRef.current = setTimeout(step, STEP_MS);
    };
    rafRef.current = setTimeout(step, STEP_MS);
    return () => clearTimeout(rafRef.current);
  }, [isPlaying]);

  const TILE =
    import.meta.env.VITE_MAP_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="relative h-full">
      {loading && (
        <div className="absolute inset-0 z-[800] flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <Spinner size={28} />
        </div>
      )}
      <MapContainer
        center={[22.5, 75.6]}
        zoom={6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={TILE} attribution="© OpenStreetMap" />
        {markerPos && <FlyTo pos={markerPos} />}
        {route.length > 1 && (
          <Polyline
            positions={route}
            color="#2563eb"
            weight={3}
            opacity={0.8}
          />
        )}
        {markerPos && (
          <Marker
            position={markerPos}
            icon={L.divIcon({
              className: "",
              html: `<div style="width:14px;height:14px;background:#2563eb;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })}
          />
        )}
      </MapContainer>
      {route.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 z-[700] bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg text-xs">
          <div className="flex justify-between text-slate-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Session detail modal ─────────────────────────────────────────────────────
function SessionModal({ open, onClose, record }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveIdx(0);
      setPlaying(false);
    }
  }, [open, record]);
  if (!open || !record) return null;

  const session = record.sessions?.[activeIdx];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary to-blue-800 text-white shrink-0">
          <div>
            <div className="text-base font-bold">Session Details</div>
            <div className="text-xs text-white/70 mt-0.5">
              {record.vehNum || record.imei} ·{" "}
              {record.repDate?.split("T")[0] ?? "—"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: session list + stats */}
          <div className="w-72 shrink-0 border-r border-slate-100 flex flex-col overflow-y-auto p-4 gap-3">
            {/* Session chips + play/pause */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Sessions</span>
              <button
                onClick={() => setPlaying((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition",
                  playing
                    ? "bg-rose-500 text-white"
                    : "bg-emerald-500 text-white",
                )}
              >
                {playing ? (
                  <>
                    <Pause size={12} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={12} /> Play
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {record.sessions?.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveIdx(i);
                    setPlaying(false);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition border",
                    activeIdx === i
                      ? "bg-primary text-white border-primary"
                      : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200",
                  )}
                >
                  Session {i + 1}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                Session {activeIdx + 1} Stats
              </p>
              {session &&
                [
                  ["Start", fmtTime(session.startTime)],
                  ["End", fmtTime(session.endTime)],
                  ["Duration", fmtDuration(session.duration)],
                  ["Distance", `${session.distance ?? 0} km`],
                  ["GPS Dist", `${session.gpsDistance ?? 0} km`],
                  ["Avg Speed", `${session.avgSpeed ?? 0} km/h`],
                  ["Status", session.status ?? "—"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-xs text-slate-400">{k}</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {v}
                    </span>
                  </div>
                ))}
              {session?.startLocation && (
                <div className="mt-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    Start Location
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {session.startLocation}
                  </p>
                </div>
              )}
              {session?.endLocation && (
                <div className="mt-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    End Location
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {session.endLocation}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: map */}
          <div className="flex-1 min-h-0" style={{ minHeight: 480 }}>
            {session && (
              <SessionMap
                key={`${record.imei}-${activeIdx}`}
                imei={record.imei}
                session={session}
                isPlaying={playing}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Account Summary Charts ───────────────────────────────────────────────────
const PIE_COLORS = [
  "#1A73E8",
  "#00897b",
  "#f59e0b",
  "#e11d48",
  "#7c3aed",
  "#0ea5e9",
  "#10b981",
  "#f97316",
  "#6366f1",
  "#ec4899",
];

function TopPerformersBar({ data }) {
  const top10 = useMemo(
    () =>
      [...data]
        .filter((a) => a.totalDistance > 0)
        .sort((a, b) => b.totalDistance - a.totalDistance)
        .slice(0, 10)
        .map((a) => ({
          name:
            a.accountName?.length > 18
              ? a.accountName.slice(0, 16) + "…"
              : a.accountName,
          full: a.accountName,
          distance: a.totalDistance,
        })),
    [data],
  );
  const max = top10[0]?.distance || 1;

  return (
    <Card>
      <h4 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
        <TrendingUp size={14} className="text-primary" /> Top 10 by Distance
      </h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={top10}
          layout="vertical"
          margin={{ top: 0, right: 48, left: 8, bottom: 0 }}
          barCategoryGap="22%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#f1f5f9"
          />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 9, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <RTooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl">
                  {payload[0].payload.full}:{" "}
                  <strong>{payload[0].value?.toLocaleString()} km</strong>
                </div>
              ) : null
            }
            cursor={{ fill: "rgba(37,99,235,0.04)" }}
          />
          <Bar
            dataKey="distance"
            radius={[0, 6, 6, 0]}
            maxBarSize={16}
            label={{
              position: "right",
              fontSize: 10,
              fill: "#475569",
              formatter: (v) => `${v}`,
            }}
          >
            {top10.map((e, i) => (
              <Cell
                key={i}
                fill={`rgba(37,99,235,${(0.35 + 0.65 * (e.distance / max)).toFixed(2)})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function FleetDonut({ data }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const slices = useMemo(() => {
    const sorted = [...data]
      .filter((a) => a.deviceCount > 0)
      .sort((a, b) => b.deviceCount - a.deviceCount);
    const top = sorted.slice(0, 14);
    const rest = sorted.slice(14);
    const total = data.reduce((s, a) => s + (a.deviceCount || 0), 0);
    const result = top.map((a) => ({
      name: a.accountName,
      value: a.deviceCount,
      total,
    }));
    if (rest.length)
      result.push({
        name: `Others (${rest.length})`,
        value: rest.reduce((s, a) => s + (a.deviceCount || 0), 0),
        total,
      });
    return result;
  }, [data]);

  const activeShape = (props) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      value,
    } = props;
    return (
      <g>
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill="#1e293b"
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill="#94a3b8"
          style={{ fontSize: 9 }}
        >
          devices
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={innerRadius - 2}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <Card>
      <h4 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Users size={14} className="text-primary" /> Fleet Distribution
      </h4>
      <div className="flex items-center gap-2" style={{ height: 280 }}>
        <ResponsiveContainer width="55%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIdx}
              activeShape={activeShape}
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={90}
              dataKey="value"
              onMouseEnter={(_, i) => setActiveIdx(i)}
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 overflow-y-auto max-h-64 pr-1 space-y-0.5">
          {slices.map((s, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition text-xs",
                activeIdx === i ? "bg-blue-50" : "hover:bg-slate-50",
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="flex-1 text-slate-600 truncate">{s.name}</span>
              <span className="font-bold text-primary shrink-0">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Account Summary Dashboard ────────────────────────────────────────────────
function AccountSummarySection({ accid }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState("totalDistance");
  const [sortDir, setSortDir] = useState("desc");
  const PER_PAGE = 10;

  useEffect(() => {
    if (!accid) return;
    setLoading(true);
    const now = new Date(),
      yest = new Date(now - 86400000);
    const fmt = (d) =>
      `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    apiService
      .getAccountSummaryReport(fmt(yest), fmt(now), accid)
      .then((res) => setData(res?.data?.data?.[0] ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accid]);

  const children = data?.childAccounts ?? [];
  const flatData = useMemo(() => flattenAccounts(children), [children]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let list = children.filter(
      (a) =>
        !term ||
        a.accountName?.toLowerCase().includes(term) ||
        String(a.accountId).includes(term),
    );
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      return (a[sortBy] - b[sortBy]) * dir;
    });
    return list;
  }, [children, search, sortBy, sortDir]);

  const paginated = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const maxDist = Math.max(...children.map((a) => a.totalDistance || 0), 1);
  const maxTime = Math.max(...children.map((a) => a.totalRunTime || 0), 1);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={28} />
        <span className="ml-3 text-sm text-slate-400">
          Loading account summary…
        </span>
      </div>
    );
  if (!data) return null;

  const kpis = [
    {
      icon: Truck,
      label: "Total Devices",
      value: data.deviceCount?.toLocaleString(),
      sub: `Across ${children.length} sub-accounts`,
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      icon: Map,
      label: "Total Distance",
      value: `${(data.totalDistance || 0).toLocaleString()} km`,
      sub: "Combined all accounts",
      color: "#00897b",
      bg: "#ecfdf5",
    },
    {
      icon: Clock,
      label: "Total Run Time",
      value: fmtSeconds(data.totalRunTime),
      sub: "Engine-on duration",
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    {
      icon: Activity,
      label: "Sub-Accounts",
      value: children.length,
      sub: "Child accounts tracked",
      color: "#8e24aa",
      bg: "#f5f3ff",
    },
  ];

  return (
    <div className="mt-8 space-y-5">
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-primary" />
        <h3 className="text-sm font-bold text-slate-800">
          Account Summary Dashboard
        </h3>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-primary ml-1">
          Last 24 hrs
        </span>
        <span className="ml-auto text-xs text-slate-400">
          {data.accountName}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: k.bg }}
            >
              <k.icon size={20} style={{ color: k.color }} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
                {k.label}
              </div>
              <div className="text-lg font-extrabold text-slate-800 leading-tight">
                {k.value}
              </div>
              <div className="text-[10px] text-slate-400">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {flatData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <TopPerformersBar data={flatData} />
          <FleetDonut data={flatData} />
        </div>
      )}

      {/* Sub-accounts table */}
      <Card>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-700">
              Sub-Account Breakdown
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
              {filtered.length}
            </span>
          </div>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search accounts…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                  Account
                </th>
                <th
                  className="px-3 py-2.5 text-center text-slate-400 font-semibold cursor-pointer"
                  onClick={() => handleSort("deviceCount")}
                >
                  Devices{" "}
                  {sortBy === "deviceCount" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-3 py-2.5 text-center text-slate-400 font-semibold cursor-pointer"
                  onClick={() => handleSort("totalDistance")}
                >
                  Distance{" "}
                  {sortBy === "totalDistance" &&
                    (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-3 py-2.5 text-center text-slate-400 font-semibold cursor-pointer"
                  onClick={() => handleSort("totalRunTime")}
                >
                  Run Time{" "}
                  {sortBy === "totalRunTime" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-3 py-2.5 text-center text-slate-400 font-semibold">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map((acc, idx) => {
                const distPct = Math.round(
                  ((acc.totalDistance || 0) / maxDist) * 100,
                );
                const timePct = Math.round(
                  ((acc.totalRunTime || 0) / maxTime) * 100,
                );
                const isActive = acc.totalDistance > 0 || acc.totalRunTime > 0;
                return (
                  <tr
                    key={acc.accountId}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-3 py-2.5 text-slate-400">
                      {page * PER_PAGE + idx + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-800">
                        {acc.accountName}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        ID: {acc.accountId}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-primary">
                        {acc.deviceCount}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-right font-bold text-slate-700 text-[11px]">
                          {(acc.totalDistance || 0).toLocaleString()}
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300 transition-all"
                            style={{ width: `${distPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-right font-bold text-slate-700 text-[11px]">
                          {fmtSeconds(acc.totalRunTime)}
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all"
                            style={{ width: `${timePct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-bold",
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {isActive ? "Active" : "Idle"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No accounts match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <span>
              {page * PER_PAGE + 1}–
              {Math.min((page + 1) * PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Prev
              </button>
              <button
                disabled={(page + 1) * PER_PAGE >= filtered.length}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const QUICK = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
];

export default function HourlyReportPage() {
  const defaultAccid = useAccountStore((s) => s.selectedAccount?.id ?? 1);

  // Filter state
  const [accountList, setAccountList] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [imeiList, setImeiList] = useState([]);
  const [imeiLoading, setImeiLoading] = useState(false);
  const [imei, setImei] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [quick, setQuick] = useState("today");

  // Report state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal
  const [modalRecord, setModalRecord] = useState(null);

  // Resolved accid for the summary section
  const resolvedAccid = selectedAccount ?? defaultAccid;

  // Load account list
  useEffect(() => {
    setAccountLoading(true);
    apiService
      .getAccountDropdown()
      .then((res) => {
        const list = (res?.data?.data ?? []).map((a) => ({
          ...a,
          id: a.id ?? a.accountId ?? a.accid,
          accountName: a.name ?? a.accountName ?? String(a.id),
        }));
        setAccountList(list);
      })
      .catch(console.error)
      .finally(() => setAccountLoading(false));
  }, []);

  // Load IMEI list when account changes
  useEffect(() => {
    const targetId = selectedAccount ?? defaultAccid;
    setImei("");
    setImeiList([]);
    setImeiLoading(true);
    apiService
      .getImeiDropdown(targetId)
      .then((list) => {
        const opts = list.map((item) => ({
          value: item.imei,
          label: item.vehnum ? `${item.vehnum} (${item.imei})` : item.imei,
        }));
        setImeiList(opts);
        // Auto-select the first IMEI so the Get Report button is enabled immediately
        if (opts.length > 0) setImei(opts[0].value);
        setImeiLoading(false);
      })
      .catch(() => setImeiLoading(false));
  }, [selectedAccount, defaultAccid]);

  const handleQuick = (key) => {
    setQuick(key);
    const r = getQuickRange(key);
    setStartDate(r.start);
    setEndDate(r.end);
  };

  const handleFetch = async () => {
    setError("");
    if (!imei) {
      setError("Please select a vehicle / IMEI.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select start and end dates.");
      return;
    }
    setLoading(true);
    setFetched(true);
    try {
      const res = await apiService.getWorkingHourReport({
        imei,
        startDate: toApiDate(startDate),
        endDate: toApiDate(endDate),
      });
      const data = res?.data?.data ?? [];
      if (!data.length) setError("No data found for the selected filters.");
      setRecords(data);
    } catch (e) {
      setError("Failed to fetch report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return records;
    const term = search.toLowerCase();
    return records.filter(
      (r) =>
        r.imei?.toLowerCase().includes(term) ||
        r.vehNum?.toLowerCase().includes(term) ||
        r.repDate?.includes(term),
    );
  }, [records, search]);

  const paginated = filtered.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage,
  );

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={["Reports", "Working Hour Report"]}
        title="Working Hour Report"
        description="Session-level trip data with playback and account-wide analytics."
      />

      {/* ── Filters ── */}
      <Card className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Account */}
          <SearchableSelect
            options={accountList}
            value={selectedAccount}
            onChange={(val) => setSelectedAccount(val)}
            loading={accountLoading}
            placeholder="Select account…"
            label="Account"
          />
          {/* IMEI */}
          <SearchableSelect
            options={imeiList}
            value={imei}
            onChange={(val) => setImei(val)}
            loading={imeiLoading}
            placeholder="Select vehicle / IMEI…"
            label={
              <>
                Vehicle / IMEI <span className="text-rose-500">*</span>
              </>
            }
          />
          {/* Start */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>
          {/* End */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>
          {/* Fetch */}
          <button
            onClick={handleFetch}
            disabled={loading || imeiLoading || !imei}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition mt-5",
              loading || imeiLoading || !imei
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover",
            )}
          >
            {loading ? (
              <>
                <Spinner size={14} /> Fetching…
              </>
            ) : (
              <>
                <Search size={14} /> Get Report
              </>
            )}
          </button>
        </div>

        {/* Quick selects */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Quick:</span>
          {QUICK.map((q) => (
            <button
              key={q.key}
              onClick={() => handleQuick(q.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg border transition",
                quick === q.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary",
              )}
            >
              {q.label}
            </button>
          ))}
        </div>

        {selectedAccount && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-primary w-fit">
            <Activity size={12} />
            Summary for:{" "}
            <strong>
              {accountList.find((a) => a.id === selectedAccount)?.accountName ??
                selectedAccount}
            </strong>
            <button
              onClick={() => setSelectedAccount(null)}
              className="ml-1 text-primary/60 hover:text-primary"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium">
            {error}
          </div>
        )}
      </Card>

      {/* ── Results table ── */}
      {(fetched || records.length > 0) && (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Report Results
              </h3>
              <span className="text-xs text-slate-400">
                {filtered.length} record(s)
              </span>
            </div>
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search IMEI, vehicle, date…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary w-52"
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Spinner size={28} />
              <span className="ml-3 text-sm text-slate-400">
                Fetching report…
              </span>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-3 py-2.5 text-slate-400 font-semibold w-10"></th>
                      <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                        IMEI
                      </th>
                      <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                        Vehicle No.
                      </th>
                      <th className="px-3 py-2.5 text-center text-slate-400 font-semibold">
                        Date
                      </th>
                      <th className="px-3 py-2.5 text-center text-slate-400 font-semibold">
                        Sessions
                      </th>
                      <th className="px-3 py-2.5 text-center text-slate-400 font-semibold">
                        Total Dist.
                      </th>
                      <th className="px-3 py-2.5 text-center text-slate-400 font-semibold">
                        Duration
                      </th>
                      <th className="px-3 py-2.5 text-center text-slate-400 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginated.map((r) => {
                      const complete = r.sessions?.every(
                        (s) => s.status === "COMPLETE",
                      );
                      return (
                        <tr
                          key={r.id ?? r.imei}
                          className="hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => setModalRecord(r)}
                        >
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalRecord(r);
                              }}
                              className="text-slate-400 hover:text-primary transition"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">
                            {r.imei}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-primary">
                            {r.vehNum || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-600">
                            {r.repDate?.split("T")[0] ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-primary">
                              {r.sessions?.length ?? 0} sessions
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                            {r.totalDistance ?? 0} km
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-600">
                            {fmtDuration(r.totalDuration)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[11px] font-bold",
                                complete
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700",
                              )}
                            >
                              {complete ? "Complete" : "Partial"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                <span>
                  {page * rowsPerPage + 1}–
                  {Math.min((page + 1) * rowsPerPage, filtered.length)} of{" "}
                  {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(+e.target.value);
                      setPage(0);
                    }}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none"
                  >
                    {[10, 25, 50].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    Prev
                  </button>
                  <button
                    disabled={(page + 1) * rowsPerPage >= filtered.length}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && fetched && filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-400">
              No data found for the selected filters.
            </div>
          )}
        </Card>
      )}

      {/* ── Account Summary ── */}
      <AccountSummarySection accid={resolvedAccid} />

      {/* ── Session detail modal ── */}
      <SessionModal
        open={!!modalRecord}
        onClose={() => setModalRecord(null)}
        record={modalRecord}
      />
    </div>
  );
}
