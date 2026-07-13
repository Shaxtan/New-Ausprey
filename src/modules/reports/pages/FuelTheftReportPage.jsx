/**
 * FuelTheftReportPage.jsx — New-Ausprey
 *
 * Detects fuel theft events by analysing the `analog[0]` (V1) sensor from
 * the Load Cell historical API. A "theft" is a rapid, significant DROP in
 * the V1 reading between consecutive readings.
 *
 * Detection algorithm:
 *   For each consecutive pair of readings (A → B):
 *     delta = B.V1 − A.V1
 *     rate  = delta / Δt (volts per minute)
 *     if delta < −DROP_THRESHOLD and rate < −RATE_THRESHOLD → THEFT event
 *     if delta > +FILL_THRESHOLD and rate > +RATE_THRESHOLD  → REFUEL event
 *
 * Thresholds (tunable via UI sliders):
 *   DROP_THRESHOLD  default 0.05 V  — minimum drop to flag
 *   RATE_THRESHOLD  default 0.02 V/min — minimum rate of change to flag
 *
 * Output:
 *   KPI cards  — Events detected, Max single drop, Estimated loss
 *   Events table — No · Type · Start time · End time · ΔV · Rate · Location
 *   Chart        — V1 over time with theft markers overlaid
 *   Export CSV / Excel / PDF
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  Search,
  ChevronDown,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Fuel,
  TrendingDown,
  TrendingUp,
  MapPin,
  Clock,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader, ExportMenu } from "@/components/common";
import { Card, Skeleton, Spinner } from "@/components/ui";
import { exportCSV, exportExcel, exportPDF } from "@/utils";
import { loadcellService } from "@/modules/devices/services/loadcell.service";
import { useAccountStore } from "@/store";
import { cn } from "@/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");

const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const fmtTs = (s) => {
  if (!s) return "—";
  const d = new Date(s.replace?.(" ", "T") ?? s);
  if (isNaN(d)) return s;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const QUICK = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
];

function applyQuick(key) {
  const now = new Date();
  now.setSeconds(0, 0);
  let s = new Date(),
    e = new Date();
  if (key === "today") {
    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
  }
  if (key === "yesterday") {
    s.setDate(now.getDate() - 1);
    s.setHours(0, 0, 0, 0);
    e.setDate(now.getDate() - 1);
    e.setHours(23, 59, 59, 999);
  }
  if (key === "last7") {
    s.setDate(now.getDate() - 7);
    s.setHours(0, 0, 0, 0);
  }
  return { from: toLocalInput(s), to: toLocalInput(e) };
}

// ─── Theft detection ──────────────────────────────────────────────────────────
/**
 * Scan the raw API rows and return theft/refuel events.
 * Uses analog[0] (V1) as the fuel level proxy.
 */
function detectEvents(rows, dropThreshold, rateThreshold) {
  if (!rows || rows.length < 2) return [];
  const events = [];

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];

    const v1Prev = Number(prev.V1 ?? prev.analog?.[0] ?? 0);
    const v1Curr = Number(curr.V1 ?? curr.analog?.[0] ?? 0);
    const delta = v1Curr - v1Prev;

    const tPrev = new Date(
      prev.time?.replace?.(" ", "T") ?? prev.time,
    ).getTime();
    const tCurr = new Date(
      curr.time?.replace?.(" ", "T") ?? curr.time,
    ).getTime();
    const dtMin = (tCurr - tPrev) / 60000;

    if (dtMin <= 0) continue;
    const rate = delta / dtMin; // V per minute

    if (delta < -dropThreshold && Math.abs(rate) > rateThreshold) {
      events.push({
        type: "THEFT",
        startTime: prev.time,
        endTime: curr.time,
        v1Start: v1Prev,
        v1End: v1Curr,
        delta: +delta.toFixed(4),
        rate: +rate.toFixed(5),
        dtMin: +dtMin.toFixed(1),
        loadStart: prev.LoadPercent ?? prev.loadPercent ?? 0,
        loadEnd: curr.LoadPercent ?? curr.loadPercent ?? 0,
      });
    } else if (delta > dropThreshold && rate > rateThreshold) {
      events.push({
        type: "REFUEL",
        startTime: prev.time,
        endTime: curr.time,
        v1Start: v1Prev,
        v1End: v1Curr,
        delta: +delta.toFixed(4),
        rate: +rate.toFixed(5),
        dtMin: +dtMin.toFixed(1),
        loadStart: prev.LoadPercent ?? prev.loadPercent ?? 0,
        loadEnd: curr.LoadPercent ?? curr.loadPercent ?? 0,
      });
    }
  }

  return events.map((e, i) => ({ ...e, no: i + 1 }));
}

// ─── IMEI searchable dropdown ─────────────────────────────────────────────────
function ImeiSelect({ options, value, onChange, loading }) {
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
          <span className="text-slate-400 flex-1">Loading vehicles…</span>
        ) : selected ? (
          <span className="text-slate-700 flex-1 truncate">
            {selected.label}
          </span>
        ) : (
          <span className="text-slate-400 flex-1">Select vehicle / IMEI…</span>
        )}
        <ChevronDown
          size={15}
          className={cn(
            "text-slate-400 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.13 }}
            className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
          >
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
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-4 text-sm text-slate-400 text-center">
                  No matches
                </p>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-sm transition",
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── KPI tile ─────────────────────────────────────────────────────────────────
function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  loading,
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-400 font-medium">{label}</div>
          {loading ? (
            <Skeleton className="h-5 w-24 mt-1" />
          ) : (
            <div className="text-base font-extrabold text-slate-800 truncate">
              {value ?? "—"}
            </div>
          )}
          {sub && !loading && (
            <div className="text-[11px] text-slate-400">{sub}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-slate-600 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">
            {Number(p.value).toFixed(4)} V
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Export columns ───────────────────────────────────────────────────────────
const EXPORT_COLS = [
  { key: "no", label: "No", width: 6 },
  { key: "type", label: "Event Type", width: 12 },
  { key: "startTime", label: "Start Time", width: 22 },
  { key: "endTime", label: "End Time", width: 22 },
  { key: "v1Start", label: "V1 Start (V)", width: 14 },
  { key: "v1End", label: "V1 End (V)", width: 14 },
  { key: "delta", label: "ΔV (V)", width: 12 },
  { key: "rate", label: "Rate (V/min)", width: 14 },
  { key: "duration", label: "Duration (min)", width: 14 },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FuelTheftReportPage() {
  const accid = useAccountStore((s) => s.selectedAccount?.id ?? 1);

  const [imeiList, setImeiList] = useState([]);
  const [imeiLoading, setImeiLoading] = useState(false);
  const [imei, setImei] = useState("");
  const [vehLabel, setVehLabel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [quick, setQuick] = useState(null);

  // Thresholds
  const [dropThreshold, setDropThreshold] = useState(0.05); // V
  const [rateThreshold, setRateThreshold] = useState(0.01); // V/min

  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  // Init dates to today
  useEffect(() => {
    const { from: f, to: t } = applyQuick("today");
    setFrom(f);
    setTo(t);
    setQuick("today");
  }, []);

  // Load IMEI list
  useEffect(() => {
    setImeiLoading(true);
    loadcellService
      .getImeis(accid)
      .then((list) => {
        setImeiList(list);
        if (list.length) {
          setImei(list[0].value);
          setVehLabel(list[0].label);
        }
        setImeiLoading(false);
      })
      .catch(() => setImeiLoading(false));
  }, [accid]);

  const handleQuick = (key) => {
    setQuick(key);
    const { from: f, to: t } = applyQuick(key);
    setFrom(f);
    setTo(t);
  };

  const handleImeiChange = (val) => {
    setImei(val);
    setVehLabel(imeiList.find((o) => o.value === val)?.label ?? val);
  };

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    setError("");
    if (!imei) {
      setError("Please select a vehicle.");
      return;
    }
    if (!from || !to) {
      setError("Please select both dates.");
      return;
    }
    if (new Date(from) > new Date(to)) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setFetched(true);
    setRawRows([]);
    try {
      const rows = await loadcellService.getHistoricalData({ imei, from, to });
      setRawRows(rows);
      if (!rows.length) setError("No load cell data found for this period.");
    } catch {
      setError("Failed to fetch load cell data.");
    } finally {
      setLoading(false);
    }
  }, [imei, from, to]);

  // ── Detect events ─────────────────────────────────────────────────────────────
  const events = useMemo(
    () => detectEvents(rawRows, dropThreshold, rateThreshold),
    [rawRows, dropThreshold, rateThreshold],
  );

  const theftEvents = events.filter((e) => e.type === "THEFT");
  const refuelEvents = events.filter((e) => e.type === "REFUEL");

  const maxDrop = theftEvents.length
    ? Math.min(...theftEvents.map((e) => e.delta))
    : 0;
  const totalDrop = theftEvents.reduce((s, e) => s + Math.abs(e.delta), 0);

  // ── Chart data ────────────────────────────────────────────────────────────────
  // Sample down to max 200 points for chart performance
  const chartData = useMemo(() => {
    if (!rawRows.length) return [];
    const step = Math.max(1, Math.floor(rawRows.length / 200));
    return rawRows
      .filter((_, i) => i % step === 0)
      .map((r) => ({
        time: r.time?.slice?.(5, 16) ?? r.time,
        V1: Number(r.V1 ?? 0),
        Load: Number(r.LoadPercent ?? 0),
      }));
  }, [rawRows]);

  // Theft event time ranges for chart reference areas
  const theftAreas = useMemo(
    () =>
      theftEvents.map((e) => ({
        x1: e.startTime?.slice?.(5, 16) ?? e.startTime,
        x2: e.endTime?.slice?.(5, 16) ?? e.endTime,
      })),
    [theftEvents],
  );

  // ── Export ────────────────────────────────────────────────────────────────────
  const exportRows = useMemo(
    () =>
      events.map((e) => ({
        no: e.no,
        type: e.type,
        startTime: fmtTs(e.startTime),
        endTime: fmtTs(e.endTime),
        v1Start: e.v1Start,
        v1End: e.v1End,
        delta: e.delta,
        rate: e.rate,
        duration: e.dtMin,
      })),
    [events],
  );

  const stamp = () => new Date().toISOString().slice(0, 10);
  const exportMeta = {
    title: `Fuel Theft Report — ${vehLabel}`,
    subtitle: `${from ? fmtTs(from.replace("T", " ") + ":00") : ""} → ${to ? fmtTs(to.replace("T", " ") + ":00") : ""} · Drop ≥ ${dropThreshold}V`,
  };

  const handleExportCSV = () =>
    exportCSV(exportRows, `fuel_theft_${imei}_${stamp()}.csv`, EXPORT_COLS);
  const handleExportExcel = () =>
    exportExcel(
      exportRows,
      `fuel_theft_${imei}_${stamp()}.xlsx`,
      EXPORT_COLS,
      "Fuel Theft Report",
    );
  const handleExportPDF = () =>
    exportPDF(
      exportRows,
      `fuel_theft_${imei}_${stamp()}`,
      EXPORT_COLS,
      exportMeta,
    );

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={["Reports", "Fuel Theft Report"]}
        title="Fuel Theft Report"
        description="Detects sudden drops in the analog sensor (V1) that indicate possible fuel theft or rapid drainage."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              disabled={events.length === 0}
              onCSV={handleExportCSV}
              onExcel={handleExportExcel}
              onPDF={handleExportPDF}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !imei}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition",
                loading || !imei
                  ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                  : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/40",
              )}
            >
              <RefreshCw size={14} className={cn(loading && "animate-spin")} />
              {loading ? "Analysing…" : "Refresh"}
            </button>
          </div>
        }
      />

      {/* ── Filters ── */}
      <Card className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Vehicle / IMEI <span className="text-rose-500">*</span>
            </label>
            <ImeiSelect
              options={imeiList}
              value={imei}
              onChange={handleImeiChange}
              loading={imeiLoading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Start Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              End Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !imei}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition",
              loading || !imei
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover",
            )}
          >
            <Search size={15} />
            {loading ? "Analysing…" : "Analyse"}
          </button>
        </div>

        {/* Quick selects */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Calendar size={12} /> Quick:
          </span>
          {QUICK.map((q) => (
            <button
              key={q.key}
              type="button"
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

        {/* Threshold controls */}
        <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600">
                Drop Threshold (V)
              </label>
              <span className="text-xs font-bold text-primary">
                {dropThreshold} V
              </span>
            </div>
            <input
              type="range"
              min={0.01}
              max={0.5}
              step={0.01}
              value={dropThreshold}
              onChange={(e) => setDropThreshold(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Sensitive (0.01V)</span>
              <span>Conservative (0.5V)</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600">
                Rate Threshold (V/min)
              </label>
              <span className="text-xs font-bold text-primary">
                {rateThreshold} V/min
              </span>
            </div>
            <input
              type="range"
              min={0.001}
              max={0.1}
              step={0.001}
              value={rateThreshold}
              onChange={(e) => setRateThreshold(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Sensitive (0.001)</span>
              <span>Conservative (0.1)</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          A drop ≥ {dropThreshold}V at a rate ≥ {rateThreshold}V/min between two
          consecutive readings is flagged as a potential theft event. Adjust
          thresholds to reduce false positives.
        </p>

        {error && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium">
            {error}
          </div>
        )}
      </Card>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <KpiTile
          icon={AlertTriangle}
          label="Theft Events"
          value={fetched ? theftEvents.length : "—"}
          iconBg="#fff1f2"
          iconColor="#f43f5e"
          loading={loading}
        />
        <KpiTile
          icon={TrendingUp}
          label="Refuel Events"
          value={fetched ? refuelEvents.length : "—"}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          loading={loading}
        />
        <KpiTile
          icon={TrendingDown}
          label="Largest Drop"
          value={
            fetched && theftEvents.length
              ? `${Math.abs(maxDrop).toFixed(4)} V`
              : "—"
          }
          iconBg="#fef9c3"
          iconColor="#ca8a04"
          loading={loading}
        />
        <KpiTile
          icon={Fuel}
          label="Total V1 Lost"
          value={fetched && totalDrop ? `${totalDrop.toFixed(4)} V` : "—"}
          sub={
            fetched
              ? `across ${theftEvents.length} event${theftEvents.length !== 1 ? "s" : ""}`
              : undefined
          }
          iconBg="#f5f3ff"
          iconColor="#8b5cf6"
          loading={loading}
        />
      </div>

      {/* ── Sensor chart ── */}
      {!loading && fetched && chartData.length > 0 && (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Analog Sensor (V1) Over Time
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Red shading marks detected theft windows · {rawRows.length}{" "}
                readings
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-primary inline-block" /> V1 Sensor
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-rose-100 border border-rose-300 inline-block rounded-sm" />{" "}
                Theft
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) => `${Number(v).toFixed(3)}V`}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Shade theft windows */}
              {theftAreas.map((a, i) => (
                <ReferenceArea
                  key={i}
                  x1={a.x1}
                  x2={a.x2}
                  fill="#fee2e2"
                  fillOpacity={0.6}
                  stroke="#fca5a5"
                />
              ))}
              <Line
                type="monotone"
                dataKey="V1"
                name="V1 Sensor"
                stroke="#2563eb"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── Events table ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Detected Events
              <span className="text-slate-400 font-normal ml-1">
                ({events.length})
              </span>
            </h3>
            {fetched && !loading && (
              <p className="text-xs text-slate-400 mt-0.5">
                {theftEvents.length} theft · {refuelEvents.length} refuel
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size={28} />
            <p className="text-xs text-slate-400">
              Fetching sensor data and detecting events…
            </p>
          </div>
        )}

        {!loading && !fetched && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Fuel size={32} className="mb-2 text-slate-300" />
            <p className="text-sm">
              Select a vehicle and date range, then click Analyse.
            </p>
          </div>
        )}

        {!loading && fetched && events.length === 0 && rawRows.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Fuel size={32} className="mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No events detected</p>
            <p className="text-xs mt-1 text-center max-w-xs">
              No drops ≥ {dropThreshold}V at rate ≥ {rateThreshold}V/min found.
              Try lowering the thresholds or extending the date range.
            </p>
          </div>
        )}

        {!loading && fetched && events.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    "#",
                    "Event",
                    "Start Time",
                    "End Time",
                    "V1 Start",
                    "V1 End",
                    "ΔV",
                    "Rate",
                    "Duration",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-slate-400 font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events.map((e) => {
                  const isTheft = e.type === "THEFT";
                  return (
                    <tr
                      key={e.no}
                      className={cn(
                        "transition align-middle",
                        isTheft
                          ? "bg-rose-50/40 hover:bg-rose-50/70"
                          : "hover:bg-slate-50",
                      )}
                    >
                      <td className="px-3 py-2.5 text-slate-400 font-medium">
                        {e.no}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold",
                            isTheft
                              ? "bg-rose-100 text-rose-600"
                              : "bg-green-100 text-green-700",
                          )}
                        >
                          {isTheft ? (
                            <>
                              <TrendingDown size={11} /> Theft
                            </>
                          ) : (
                            <>
                              <TrendingUp size={11} /> Refuel
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock
                            size={11}
                            className="text-slate-400 shrink-0"
                          />
                          {fmtTs(e.startTime)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock
                            size={11}
                            className="text-slate-400 shrink-0"
                          />
                          {fmtTs(e.endTime)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">
                        {e.v1Start.toFixed(4)} V
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">
                        {e.v1End.toFixed(4)} V
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 font-mono font-bold",
                          isTheft ? "text-rose-600" : "text-green-600",
                        )}
                      >
                        {e.delta > 0 ? "+" : ""}
                        {e.delta.toFixed(4)} V
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-500">
                        {e.rate.toFixed(4)} V/min
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {e.dtMin} min
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-3 py-2.5 bg-slate-50
                            border-t border-slate-100 text-xs text-slate-500"
            >
              <span>
                {events.length} event{events.length !== 1 ? "s" : ""} detected
              </span>
              {theftEvents.length > 0 && (
                <span className="font-semibold text-rose-600">
                  Total V1 lost to theft: {totalDrop.toFixed(4)} V
                </span>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
