/**
 * OverspeedReportPage.jsx — New-Ausprey
 *
 * Fetches all alerts via getAlertsByAccount, filters for type === 'OVS',
 * and presents:
 *
 *  KPI row  — Total incidents · Vehicles affected · Max speed recorded
 *              · Most frequent offender
 *
 *  View toggle:
 *    • Summary tab — per-vehicle table (incidents, max speed, avg speed,
 *                    last incident) + horizontal bar chart of top offenders
 *    • Incidents tab — every OVS event flat (vehicle, speed, time, location)
 *
 *  Filters — Account dropdown, datetime range, quick selects,
 *            speed threshold slider (highlight rows above threshold),
 *            vehicle / IMEI search
 *
 *  Export — CSV / Excel / PDF for the active view
 */

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Calendar,
  RefreshCw,
  Gauge,
  Truck,
  AlertTriangle,
  Zap,
  MapPin,
  Clock,
  ExternalLink,
  BarChart2,
  List,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/common";
import { ExportMenu } from "@/components/common";
import { Card, Skeleton, Spinner } from "@/components/ui";
import { exportCSV, exportExcel, exportPDF } from "@/utils";
import apiService from "@/services/apiService";
import { useAccountStore } from "@/store";
import { cn } from "@/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");

const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** API wants "yyyy-MM-dd HH:mm:ss" */
const toApiDateTime = (v) => (v ? v.replace("T", " ") + ":00" : "");

const fmtTs = (s) => {
  if (!s) return "—";
  const d = new Date((s ?? "").replace(" ", "T"));
  if (isNaN(d)) return s;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

// ─── Per-vehicle summary aggregation ─────────────────────────────────────────
function aggregateByVehicle(events) {
  const map = new Map();
  for (const e of events) {
    const key = e.imei ?? e.vehicleNumber ?? "Unknown";
    if (!map.has(key)) {
      map.set(key, {
        imei: e.imei ?? "—",
        vehicle: e.vehicleNumber || e.imei || "Unknown",
        incidents: 0,
        maxSpeed: 0,
        totalSpeed: 0,
        lastTs: null,
        lastAddress: null,
      });
    }
    const row = map.get(key);
    const sp = Number(e.speed ?? 0);
    row.incidents++;
    row.totalSpeed += sp;
    if (sp > row.maxSpeed) row.maxSpeed = sp;
    const ts = e.deviceTime || e.createdOn;
    if (!row.lastTs || new Date(ts) > new Date(row.lastTs)) {
      row.lastTs = ts;
      row.lastAddress = e.address || null;
    }
  }
  return [...map.values()]
    .map((r) => ({
      ...r,
      avgSpeed: r.incidents ? Math.round(r.totalSpeed / r.incidents) : 0,
    }))
    .sort((a, b) => b.incidents - a.incidents);
}

// ─── Speed badge ──────────────────────────────────────────────────────────────
function SpeedBadge({ speed, threshold }) {
  const sp = Number(speed ?? 0);
  const over = sp > threshold;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
        sp >= 100
          ? "bg-rose-50 text-rose-600"
          : sp >= 80
            ? "bg-amber-50 text-amber-600"
            : "bg-slate-100 text-slate-600",
      )}
    >
      <Gauge size={10} />
      {sp} km/h
      {over && <span className="ml-0.5">⚠</span>}
    </span>
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
            <Skeleton className="h-5 w-28 mt-1" />
          ) : (
            <div className="text-base font-extrabold text-slate-800 truncate">
              {value ?? "—"}
            </div>
          )}
          {sub && !loading && (
            <div className="text-[11px] text-slate-400 truncate">{sub}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 12,
};

// ─── Export columns ───────────────────────────────────────────────────────────
const SUMMARY_COLS = [
  { key: "rank", label: "Rank", width: 6 },
  { key: "vehicle", label: "Vehicle No.", width: 16 },
  { key: "imei", label: "IMEI", width: 20 },
  { key: "incidents", label: "Incidents", width: 10 },
  { key: "maxSpeed", label: "Max Speed (km/h)", width: 14 },
  { key: "avgSpeed", label: "Avg Speed (km/h)", width: 14 },
  { key: "lastTs", label: "Last Incident", width: 22 },
];

const INCIDENT_COLS = [
  { key: "no", label: "No", width: 6 },
  { key: "vehicle", label: "Vehicle No.", width: 16 },
  { key: "imei", label: "IMEI", width: 20 },
  { key: "speed", label: "Speed (km/h)", width: 14 },
  { key: "time", label: "Time", width: 22 },
  { key: "address", label: "Address", width: 40 },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OverspeedReportPage() {
  const accounts = useAccountStore((s) => s.accounts);
  const storeSelected = useAccountStore((s) => s.selectedAccount);
  const loadAccounts = useAccountStore((s) => s.loadAccounts);

  const [accountId, setAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [quick, setQuick] = useState(null);
  const [threshold, setThreshold] = useState(60); // km/h highlight threshold
  const [search, setSearch] = useState("");
  const [view, setView] = useState("summary"); // 'summary' | 'incidents'

  const [rawAlerts, setRawAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  // Load accounts + set default
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);
  useEffect(() => {
    if (!accountId && accounts.length)
      setAccountId(storeSelected?.id ?? accounts[0].id);
  }, [accounts, storeSelected, accountId]);

  // Default to today
  useEffect(() => {
    const { from, to } = applyQuick("today");
    setFromDate(from);
    setToDate(to);
    setQuick("today");
  }, []);

  const handleQuick = (key) => {
    setQuick(key);
    const { from, to } = applyQuick(key);
    setFromDate(from);
    setToDate(to);
  };

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    setError("");
    if (!accountId || !fromDate || !toDate) {
      setError("Please select an account and both dates.");
      return;
    }
    setLoading(true);
    setFetched(true);
    setRawAlerts([]);
    try {
      const res = await apiService.getAlertsByAccount({
        accid: String(accountId),
        startTime: toApiDateTime(fromDate),
        endTime: toApiDateTime(toDate),
        pageSize: 0,
      });
      if (res?.data?.resultCode === 1) {
        // Filter to OVS only
        const ovs = (res.data.data ?? []).filter((a) => a.type === "OVS");
        setRawAlerts(ovs);
      } else {
        setError(res?.data?.message || "Failed to fetch alerts.");
      }
    } catch {
      setError("Failed to fetch alerts.");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const incidents = useMemo(() => {
    const term = search.toLowerCase();
    const list = term
      ? rawAlerts.filter(
          (a) =>
            (a.vehicleNumber || "").toLowerCase().includes(term) ||
            (a.imei || "").toLowerCase().includes(term),
        )
      : rawAlerts;
    return [...list].sort(
      (a, b) => new Date(b.createdOn) - new Date(a.createdOn),
    );
  }, [rawAlerts, search]);

  const summary = useMemo(() => {
    const rows = aggregateByVehicle(incidents);
    const term = search.toLowerCase();
    return term
      ? rows.filter(
          (r) =>
            r.vehicle.toLowerCase().includes(term) ||
            r.imei.toLowerCase().includes(term),
        )
      : rows;
  }, [incidents, search]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const totalIncidents = incidents.length;
  const vehiclesAffected = summary.length;
  const maxSpeed = incidents.length
    ? Math.max(...incidents.map((a) => Number(a.speed ?? 0)))
    : 0;
  const topOffender = summary[0];

  // ── Chart data (top 8 by incidents) ──────────────────────────────────────────
  const chartData = useMemo(
    () =>
      summary.slice(0, 8).map((r, i) => ({
        name: r.vehicle.length > 14 ? r.vehicle.slice(0, 12) + "…" : r.vehicle,
        fullName: r.vehicle,
        incidents: r.incidents,
        maxSpeed: r.maxSpeed,
        fill: i === 0 ? "#ef4444" : i <= 2 ? "#f97316" : "#8b5cf6",
      })),
    [summary],
  );

  // ── Export rows ───────────────────────────────────────────────────────────────
  const summaryExportRows = useMemo(
    () =>
      summary.map((r, i) => ({
        rank: i + 1,
        vehicle: r.vehicle,
        imei: r.imei,
        incidents: r.incidents,
        maxSpeed: r.maxSpeed,
        avgSpeed: r.avgSpeed,
        lastTs: fmtTs(r.lastTs),
      })),
    [summary],
  );

  const incidentExportRows = useMemo(
    () =>
      incidents.map((a, i) => ({
        no: i + 1,
        vehicle: a.vehicleNumber || "—",
        imei: a.imei || "—",
        speed: Number(a.speed ?? 0),
        time: fmtTs(a.deviceTime || a.createdOn),
        address: a.address || "—",
      })),
    [incidents],
  );

  const stamp = () => new Date().toISOString().slice(0, 10);
  const acctLabel =
    accounts.find((a) => String(a.id) === String(accountId))?.label ?? "";
  const exportMeta = {
    title: `Overspeed Report — ${acctLabel}`,
    subtitle: `${fromDate ? fmtTs(fromDate.replace("T", " ") + ":00") : ""} → ${toDate ? fmtTs(toDate.replace("T", " ") + ":00") : ""}`,
  };

  const activeRows =
    view === "summary" ? summaryExportRows : incidentExportRows;
  const activeCols = view === "summary" ? SUMMARY_COLS : INCIDENT_COLS;

  const handleExportCSV = () =>
    exportCSV(activeRows, `overspeed_${view}_${stamp()}.csv`, activeCols);
  const handleExportExcel = () =>
    exportExcel(
      activeRows,
      `overspeed_${view}_${stamp()}.xlsx`,
      activeCols,
      "Overspeed Report",
    );
  const handleExportPDF = () =>
    exportPDF(
      activeRows,
      `overspeed_${view}_${stamp()}`,
      activeCols,
      exportMeta,
    );

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={["Reports", "Overspeed Report"]}
        title="Overspeed Report"
        description="Overspeed incidents per vehicle — frequency, peak speeds, and locations."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              disabled={incidents.length === 0}
              onCSV={handleExportCSV}
              onExcel={handleExportExcel}
              onPDF={handleExportPDF}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !accountId}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition",
                loading || !accountId
                  ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                  : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/40",
              )}
            >
              <RefreshCw size={14} className={cn(loading && "animate-spin")} />
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        }
      />

      {/* ── Filters ── */}
      <Card className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Account */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Account <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 pr-8"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* From datetime */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              From
            </label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>

          {/* To datetime */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              To
            </label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={loading || !accountId}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition",
              loading || !accountId
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover",
            )}
          >
            <Search size={15} />
            {loading ? "Fetching…" : "Search"}
          </button>
        </div>

        {/* Quick selects + speed threshold */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
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

          {/* Speed threshold */}
          <div className="ml-auto flex items-center gap-2">
            <Gauge size={13} className="text-slate-400" />
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Highlight ≥
            </label>
            <input
              type="number"
              value={threshold}
              min={40}
              max={200}
              step={5}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-20 px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 outline-none focus:border-primary"
            />
            <span className="text-xs text-slate-400">km/h</span>
          </div>
        </div>

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
          label="Total Incidents"
          value={fetched ? totalIncidents : "—"}
          iconBg="#fff1f2"
          iconColor="#f43f5e"
          loading={loading}
        />
        <KpiTile
          icon={Truck}
          label="Vehicles Affected"
          value={fetched ? vehiclesAffected : "—"}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          loading={loading}
        />
        <KpiTile
          icon={Zap}
          label="Max Speed Recorded"
          value={fetched ? `${maxSpeed} km/h` : "—"}
          iconBg="#f5f3ff"
          iconColor="#8b5cf6"
          loading={loading}
        />
        <KpiTile
          icon={Gauge}
          label="Top Offender"
          value={fetched ? (topOffender?.vehicle ?? "None") : "—"}
          sub={topOffender ? `${topOffender.incidents} incidents` : undefined}
          iconBg="#fff7ed"
          iconColor="#f97316"
          loading={loading}
        />
      </div>

      {/* ── Results ── */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* View toggle + count */}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-800">
              {view === "summary" ? "Vehicle Summary" : "All Incidents"}
              <span className="text-slate-400 font-normal ml-1">
                ({view === "summary" ? summary.length : incidents.length})
              </span>
            </h3>
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs">
              <button
                onClick={() => setView("summary")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-semibold transition",
                  view === "summary"
                    ? "bg-primary text-white"
                    : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <BarChart2 size={13} /> Summary
              </button>
              <button
                onClick={() => setView("incidents")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-semibold transition border-l border-slate-200",
                  view === "incidents"
                    ? "bg-primary text-white"
                    : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <List size={13} /> Incidents
              </button>
            </div>
          </div>

          {/* Search */}
          {fetched && (
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicle / IMEI…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-primary w-44"
              />
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size={28} />
            <p className="text-xs text-slate-400">Fetching overspeed alerts…</p>
          </div>
        )}

        {/* Not searched yet */}
        {!loading && !fetched && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Gauge size={32} className="mb-2 text-slate-300" />
            <p className="text-sm">
              Select an account and date range, then click Search.
            </p>
          </div>
        )}

        {/* No data */}
        {!loading && fetched && incidents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Gauge size={32} className="mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No overspeed events found</p>
            <p className="text-xs mt-1">
              Try a different account or wider date range.
            </p>
          </div>
        )}

        {/* ── Summary view ── */}
        {!loading && fetched && incidents.length > 0 && view === "summary" && (
          <>
            {/* Bar chart — top offenders */}
            {chartData.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 mb-3">
                  Top offenders by incident count
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v, name, { payload }) =>
                        name === "incidents"
                          ? [`${v} incidents`, payload.fullName]
                          : [v, name]
                      }
                    />
                    <Bar dataKey="incidents" radius={[0, 6, 6, 0]} barSize={20}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Summary table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[
                      "Rank",
                      "Vehicle No.",
                      "IMEI",
                      "Incidents",
                      "Max Speed",
                      "Avg Speed",
                      "Last Incident",
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
                  {summary.map((r, i) => (
                    <tr
                      key={r.imei}
                      className={cn(
                        "transition align-middle",
                        r.maxSpeed >= threshold
                          ? "hover:bg-rose-50/40"
                          : "hover:bg-slate-50",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex w-6 h-6 rounded-full items-center justify-center text-[11px] font-bold text-white",
                            i === 0
                              ? "bg-rose-500"
                              : i <= 2
                                ? "bg-amber-500"
                                : "bg-slate-400",
                          )}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-primary whitespace-nowrap">
                        {r.vehicle}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-500">
                        {r.imei}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
                            r.incidents >= 10
                              ? "bg-rose-50 text-rose-600"
                              : r.incidents >= 5
                                ? "bg-amber-50 text-amber-600"
                                : "bg-slate-100 text-slate-600",
                          )}
                        >
                          <AlertTriangle size={10} />
                          {r.incidents}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <SpeedBadge speed={r.maxSpeed} threshold={threshold} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-semibold">
                        {r.avgSpeed} km/h
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                        {fmtTs(r.lastTs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Incidents view ── */}
        {!loading &&
          fetched &&
          incidents.length > 0 &&
          view === "incidents" && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[
                      "#",
                      "Vehicle No.",
                      "IMEI",
                      "Speed",
                      "Time",
                      "Location",
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
                  {incidents.map((a, i) => {
                    const sp = Number(a.speed ?? 0);
                    const isHigh = sp >= threshold;
                    return (
                      <tr
                        key={a.id ?? i}
                        className={cn(
                          "transition align-middle",
                          isHigh
                            ? "bg-rose-50/30 hover:bg-rose-50/60"
                            : "hover:bg-slate-50",
                        )}
                      >
                        <td className="px-3 py-2.5 text-slate-400 font-medium">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-primary whitespace-nowrap">
                          {a.vehicleNumber || "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-500">
                          {a.imei}
                        </td>
                        <td className="px-3 py-2.5">
                          <SpeedBadge speed={a.speed} threshold={threshold} />
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <Clock
                              size={11}
                              className="text-slate-400 shrink-0"
                            />
                            {fmtTs(a.deviceTime || a.createdOn)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-xs">
                          {a.address ? (
                            <span className="flex items-start gap-1">
                              <MapPin
                                size={11}
                                className="text-slate-400 shrink-0 mt-0.5"
                              />
                              <span className="line-clamp-1">{a.address}</span>
                            </span>
                          ) : a.latitude && a.longitude ? (
                            <a
                              href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <MapPin size={11} /> View on Maps
                              <ExternalLink
                                size={10}
                                className="text-slate-400"
                              />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                <span>{incidents.length} incidents</span>
                <span className="font-semibold">
                  Incidents ≥ {threshold} km/h:{" "}
                  <span className="text-rose-600">
                    {
                      incidents.filter((a) => Number(a.speed ?? 0) >= threshold)
                        .length
                    }
                  </span>
                </span>
              </div>
            </div>
          )}
      </Card>
    </div>
  );
}
