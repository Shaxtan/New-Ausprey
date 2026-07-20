/**
 * AlertsPage.jsx — New-Ausprey "Alert Dashboard"
 *
 * Real implementation against POST /usage/alerts/by-account.
 *
 * Layout refactor (this version):
 *   - Single KPI row: Total / Critical Open / Acknowledged / Resolved / SLA Breached
 *   - 3-panel overview row: Live Map (expandable) / Severity Donut / Alert Performance
 *     — all three locked to ROW1_HEIGHT so they always align, regardless of
 *     what each underlying component naturally renders.
 *   - Categories + Response Status + Critical Alerts row — same idea, locked
 *     to ROW2_HEIGHT.
 *   - Restyled "All Alerts" table: colored pill tabs, sort indicator, kebab actions
 *
 * IMPORTANT: severity is DERIVED from alert `type` (see utils/alertSeverity.js)
 * because the API doesn't return one. Acknowledge/Resolve status is tracked
 * LOCALLY in this browser (see hooks/useAlertTriage.js) because there is no
 * backend alert-workflow endpoint — this is surfaced honestly in the UI
 * rather than implied as server-synced.
 *
 * "SLA Breached" and the Alert Performance rate metrics (Acknowledgement /
 * Resolution / Repeat / SLA Breach rate) are computed directly from real
 * alert timestamps + the same local triage state — no fabricated historical
 * data. Avg response/resolution TIME is intentionally NOT shown: computing
 * it needs timestamped triage events, which useAlertTriage doesn't track yet.
 * "Driver/Owner" and "Assigned To" are omitted from the table for the same
 * reason — there's no such field on the alert payload.
 *
 * HEIGHT-ALIGNMENT TECHNIQUE:
 * PanelShell (below) locks every card in a row to the same explicit pixel
 * height via inline style + flex-col, with the header pinned at the top and
 * content filling the rest. This guarantees identical outer box heights
 * across a row even though AlertLiveMap / AlertSeverityDonut /
 * AlertCategoriesChart / ResponseStatusCard / CriticalAlertsListCard are
 * external components whose natural/internal heights aren't controlled here.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  MapPin,
  Clock,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Repeat,
  Eye,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { PageHeader, KpiCard, ExportMenu, Trend } from "@/components/common";
import { Card, CardHeader, Skeleton, Spinner } from "@/components/ui";
import { exportCSV, exportExcel, exportPDF, formatNumber, cn } from "@/utils";
import apiService from "@/services/apiService";
import { useAccountStore } from "@/store";
import { PATHS } from "@/constants";
import { typeLabel } from "@/modules/dashboard/components/AlertsModal";
import { classifyAlert, SEVERITY_META } from "../utils/alertSeverity";
import { useAlertTriage } from "../hooks/useAlertTriage";
import { AlertLiveMap } from "../components/AlertLiveMap";
import { AlertSeverityDonut } from "../components/AlertSeverityDonut";
import { AlertCategoriesChart } from "../components/AlertCategoriesChart";
import {
  ResponseStatusCard,
  STATUS_META,
} from "../components/ResponseStatusCard";
import { CriticalAlertsListCard } from "../components/CriticalAlertsListCard";

const pad = (n) => String(n).padStart(2, "0");

const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const toApiDateTime = (v) => (v ? v.replace("T", " ") + ":00" : "");

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d)) return s;
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const QUICK = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last 7 Days" },
];

const PAGE_SIZES = [10, 25, 50];

// Threshold-based, not a contractual SLA — "open longer than N minutes".
const SLA_BREACH_MINUTES = 30;

// ─── Row height constants — single source of truth for alignment ───────────
const ROW1_HEIGHT = 430; // Live Map / Severity Donut / Alert Performance
const ROW2_HEIGHT = 380; // Categories / Response Status / Critical Alerts
const EXPANDED_MAP_HEIGHT = 560;

// ─── PanelShell — locks a card to an exact height so every panel in a row ───
// ─── aligns perfectly, regardless of the internal component's own height ───
function PanelShell({ height, title, subtitle, action, scroll = false, children }) {
  return (
    <Card hover className="flex flex-col" style={{ height }}>
      <div className="shrink-0 flex items-start justify-between gap-2">
        <CardHeader title={title} subtitle={subtitle} />
        {action}
      </div>
      <div
        className="flex-1 min-h-0 mt-2"
        style={{ overflow: scroll ? "auto" : "hidden" }}
      >
        {children}
      </div>
    </Card>
  );
}

// ─── Small self-contained sparkline (no chart-lib dependency) ────────────────
function Sparkline({ data, color = "#2563eb", height = 22 }) {
  if (!data.length) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-[9px] text-slate-300"
      >
        —
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 100;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data
    .map(
      (d, i) =>
        `${i * step},${height - (d.count / max) * (height - 4) - 2}`,
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Alert Performance panel content (real, computable metrics only) ────────
function AlertPerformanceContent({
  ackRate,
  resolvedRate,
  repeatRate,
  slaBreachRate,
  dailyVolume,
}) {
  const rows = [
    {
      icon: CheckCircle2,
      color: "#2563eb",
      label: "Acknowledgement Rate",
      value: `${ackRate.toFixed(1)}%`,
    },
    {
      icon: ShieldCheck,
      color: "#16a34a",
      label: "Resolution Rate",
      value: `${resolvedRate.toFixed(1)}%`,
    },
    {
      icon: Repeat,
      color: "#d97706",
      label: "Repeat Alert Rate",
      value: `${repeatRate.toFixed(1)}%`,
    },
    {
      icon: AlertTriangle,
      color: "#e11d48",
      label: "SLA Breach Rate",
      value: `${slaBreachRate.toFixed(1)}%`,
    },
  ];
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-3.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${r.color}1a` }}
            >
              <r.icon size={14} style={{ color: r.color }} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-slate-500">{r.label}</div>
              <div className="text-sm font-bold text-slate-800">{r.value}</div>
            </div>
            <div className="w-16 shrink-0">
              <Sparkline data={dailyVolume} color={r.color} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 pt-3 mt-3 border-t border-slate-100 leading-relaxed">
        Rates computed from alerts in the selected period. Sparkline shows
        daily alert volume.
      </p>
    </div>
  );
}

// ─── Status pill tabs (colors reused from STATUS_META — no new palette) ─────
function StatusTabs({ value, onChange, counts }) {
  const items = [
    { key: "all", label: "All Alerts", color: "#475569" },
    { key: "open", label: "Open", color: STATUS_META.open.color },
    {
      key: "acknowledged",
      label: "Acknowledged",
      color: STATUS_META.acknowledged.color,
    },
    { key: "resolved", label: "Resolved", color: STATUS_META.resolved.color },
  ];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border",
              active
                ? "border-transparent"
                : "border-slate-200 text-slate-500 hover:border-slate-300",
            )}
            style={
              active ? { background: `${it.color}1a`, color: it.color } : undefined
            }
          >
            {it.label}
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px]"
              style={{
                background: active ? "#fff" : "#f1f5f9",
                color: active ? it.color : "#64748b",
              }}
            >
              {counts[it.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Kebab actions menu (Acknowledge / Resolve / Reopen) ────────────────────
function AlertActionsMenu({ status, onAcknowledge, onResolve, onReopen }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-slate-100 bg-white shadow-lg py-1">
          {status === "open" && (
            <button
              onClick={() => {
                onAcknowledge();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
            >
              <Check size={12} /> Acknowledge
            </button>
          )}
          {status === "acknowledged" && (
            <button
              onClick={() => {
                onResolve();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50"
            >
              <ShieldCheck size={12} /> Resolve
            </button>
          )}
          {status !== "open" && (
            <button
              onClick={() => {
                onReopen();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
            >
              <RotateCcw size={12} /> Reopen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const [searchParams] = useSearchParams();
  const imeiFromQuery = searchParams.get("imei") || "";
  const navigate = useNavigate();

  const accounts = useAccountStore((s) => s.accounts);
  const storeSelected = useAccountStore((s) => s.selectedAccount);
  const loadAccounts = useAccountStore((s) => s.loadAccounts);

  const [accountId, setAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [quick, setQuick] = useState(null);
  const [imeiFilter, setImeiFilter] = useState(imeiFromQuery);

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const [statusTab, setStatusTab] = useState("all"); // all | open | acknowledged | resolved
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mapExpanded, setMapExpanded] = useState(false);

  const { getStatus, acknowledge, resolve, reopen } = useAlertTriage(accountId);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);
  useEffect(() => {
    if (!accountId && accounts.length)
      setAccountId(storeSelected?.id ?? accounts[0].id);
  }, [accounts, storeSelected, accountId]);

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
    setFromDate(toLocalInput(s));
    setToDate(toLocalInput(e));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!accountId || !fromDate || !toDate) {
      setError("Please select an account and both dates.");
      return;
    }
    setLoading(true);
    setSearched(true);
    setPage(1);
    try {
      const payload = {
        accid: String(accountId),
        startTime: toApiDateTime(fromDate),
        endTime: toApiDateTime(toDate),
        pageSize: 0,
      };
      const res = await apiService.getAlertsByAccount(payload);
      if (res?.data?.resultCode === 1) {
        setAlerts(res.data.data ?? []);
      } else {
        setAlerts([]);
        setError(res?.data?.message || "Failed to fetch alerts.");
      }
    } catch {
      setAlerts([]);
      setError("Failed to fetch alerts.");
    } finally {
      setLoading(false);
    }
  };

  // ── Base filtered set (search term applied, sorted newest-first) ────────────
  const filtered = useMemo(() => {
    const term = imeiFilter.trim().toLowerCase();
    const list = term
      ? alerts.filter(
          (a) =>
            (a.imei || "").toLowerCase().includes(term) ||
            (a.vehicleNumber || "").toLowerCase().includes(term),
        )
      : alerts;
    return [...list].sort(
      (a, b) => new Date(b.createdOn) - new Date(a.createdOn),
    );
  }, [alerts, imeiFilter]);

  const total = filtered.length;
  const ackCount = filtered.filter(
    (a) => getStatus(a.id) === "acknowledged",
  ).length;
  const resolvedCount = filtered.filter(
    (a) => getStatus(a.id) === "resolved",
  ).length;
  const repeatVehicles = useMemo(() => {
    const byVehicle = filtered.reduce((acc, a) => {
      const key = a.vehicleNumber ?? a.imei;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.values(byVehicle).filter((c) => c >= 2).length;
  }, [filtered]);

  // Critical alerts that are still open right now (severity + live status combined)
  const criticalOpenCount = useMemo(
    () =>
      filtered.filter((a) => {
        const { severity } = classifyAlert(a, typeLabel(a.type));
        return severity === "critical" && getStatus(a.id) === "open";
      }).length,
    [filtered, getStatus],
  );

  // Open alerts that have sat unactioned past the threshold — a simple,
  // honest "open too long" flag, not a formal contractual SLA.
  const slaBreachedCount = useMemo(() => {
    const now = Date.now();
    return filtered.filter((a) => {
      if (getStatus(a.id) !== "open") return false;
      const created = new Date(a.createdOn).getTime();
      if (isNaN(created)) return false;
      return now - created > SLA_BREACH_MINUTES * 60000;
    }).length;
  }, [filtered, getStatus]);

  const pctOfTotal = (n) => (total ? (n / total) * 100 : 0);
  const ackRate = pctOfTotal(ackCount);
  const resolvedRate = pctOfTotal(resolvedCount);
  const repeatRate = pctOfTotal(repeatVehicles);
  const slaBreachRate = pctOfTotal(slaBreachedCount);

  // Real daily alert-volume distribution, used for the performance sparklines
  const dailyVolume = useMemo(() => {
    const buckets = {};
    filtered.forEach((a) => {
      const d = new Date(a.createdOn);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      buckets[key] = (buckets[key] ?? 0) + 1;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [filtered]);

  // Row 1 — single KPI row (5 cards)
  const kpis = [
    {
      icon: Bell,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
      label: "Total Alerts",
      value: formatNumber(total),
      trend: <Trend value="In selected period" neutral />,
    },
    {
      icon: AlertOctagon,
      iconBg: SEVERITY_META.critical.bg,
      iconColor: SEVERITY_META.critical.color,
      label: "Critical Open",
      value: formatNumber(criticalOpenCount),
      trend: <Trend value="Currently open" neutral />,
    },
    {
      icon: CheckCircle2,
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      label: "Acknowledged",
      value: formatNumber(ackCount),
      trend: <Trend value="Tracked locally" neutral />,
    },
    {
      icon: ShieldCheck,
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
      label: quick === "today" ? "Resolved Today" : "Resolved",
      value: formatNumber(resolvedCount),
      trend: <Trend value="Tracked locally" neutral />,
    },
    {
      icon: AlertTriangle,
      iconBg: "#fee2e2",
      iconColor: "#e11d48",
      label: "SLA Breached",
      value: formatNumber(slaBreachedCount),
      trend: <Trend value={`Open > ${SLA_BREACH_MINUTES}m`} neutral />,
    },
  ];

  // ── Status-tab filtered + paginated table data ────────────────────────────────
  const tableRows = useMemo(() => {
    if (statusTab === "all") return filtered;
    return filtered.filter((a) => getStatus(a.id) === statusTab);
  }, [filtered, statusTab, getStatus]);

  const tabCounts = useMemo(
    () => ({
      all: filtered.length,
      open: filtered.filter((a) => getStatus(a.id) === "open").length,
      acknowledged: ackCount,
      resolved: resolvedCount,
    }),
    [filtered, getStatus, ackCount, resolvedCount],
  );

  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const pageRows = tableRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [statusTab, pageSize, imeiFilter]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const ALERT_EXPORT_COLS = [
    { key: "no", label: "No", width: 6 },
    { key: "vehicleNo", label: "Vehicle No", width: 16 },
    { key: "imei", label: "IMEI", width: 20 },
    { key: "type", label: "Alert Type", width: 14 },
    { key: "severity", label: "Severity", width: 10 },
    { key: "status", label: "Status", width: 14 },
    { key: "time", label: "Time", width: 20 },
    { key: "speed", label: "Speed (km/h)", width: 14 },
    { key: "battery", label: "Battery (V)", width: 14 },
    { key: "address", label: "Address", width: 40 },
    { key: "message", label: "Message", width: 40 },
  ];

  const exportRows = useMemo(
    () =>
      filtered.map((a, i) => {
        const { severity, label } = classifyAlert(a, typeLabel(a.type));
        return {
          no: i + 1,
          vehicleNo: a.vehicleNumber || "N/A",
          imei: a.imei || "",
          type: label || "General Alert",
          severity: SEVERITY_META[severity].label,
          status: STATUS_META[getStatus(a.id)].label,
          time: fmtDate(a.deviceTime || a.createdOn),
          speed: a.speed ?? "",
          battery: a.battery ?? "",
          address: a.address || "",
          message: a.message || "",
        };
      }),
    [filtered, getStatus],
  );

  const selectedAccount = accounts.find(
    (a) => String(a.id) === String(accountId),
  );
  const exportMeta = {
    title: "Alert Dashboard Export",
    subtitle: `${selectedAccount?.label ?? ""} · ${fromDate ? fmtDate(fromDate.replace("T", " ") + ":00") : ""} → ${toDate ? fmtDate(toDate.replace("T", " ") + ":00") : ""}`,
  };
  const stamp = () => new Date().toISOString().slice(0, 10);
  const handleExportCSV = () =>
    exportCSV(exportRows, `alerts_${stamp()}.csv`, ALERT_EXPORT_COLS);
  const handleExportExcel = () =>
    exportExcel(
      exportRows,
      `alerts_${stamp()}.xlsx`,
      ALERT_EXPORT_COLS,
      "Alerts",
    );
  const handleExportPDF = () =>
    exportPDF(exportRows, `alerts_${stamp()}`, ALERT_EXPORT_COLS, exportMeta);

  const trackVehicle = (a) =>
    navigate(PATHS.TRACKING, {
      state: { targetImei: a.imei, targetAccountId: a.accId },
    });

  const scrollToTable = () =>
    document
      .getElementById("alerts-table-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={["Monitoring", "Alerts"]}
        title="Alert Dashboard"
        description="Monitor, prioritize, and review fleet alerts in real time."
        actions={
          <ExportMenu
            disabled={filtered.length === 0}
            onCSV={handleExportCSV}
            onExcel={handleExportExcel}
            onPDF={handleExportPDF}
          />
        }
      />

      {imeiFromQuery && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border-l-4 border-primary">
          <Bell size={14} className="text-primary shrink-0" />
          <span className="text-sm text-slate-700">
            Filter active: showing alerts for IMEI{" "}
            <strong className="text-primary">{imeiFromQuery}</strong>
          </span>
          <button
            onClick={() => setImeiFilter("")}
            className="ml-auto text-xs font-semibold text-rose-500 hover:text-rose-600"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Filter form */}
      <Card className="mb-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Filter Alert Logs
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-primary"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                From Date
              </label>
              <input
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                To Date
              </label>
              <input
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Filter by IMEI / Vehicle No
              </label>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={imeiFilter}
                  onChange={(e) => setImeiFilter(e.target.value)}
                  placeholder="e.g. 356938035643809"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {QUICK.map((q) => (
              <button
                key={q.key}
                type="button"
                onClick={() => handleQuick(q.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg border transition",
                  quick === q.key
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-500 border-slate-200 hover:border-primary",
                )}
              >
                {q.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "px-8 py-2.5 rounded-xl text-sm font-bold text-white transition",
                loading
                  ? "bg-primary/50 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-hover",
              )}
            >
              {loading ? "Searching…" : "Search Logs"}
            </button>
          </div>
        </form>
      </Card>

      {!searched ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Bell size={28} className="mb-2 text-slate-300" />
            <p className="text-sm">
              Choose an account and date range, then search.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-5">
            {kpis.map((k, i) => (
              <KpiCard key={k.label} {...k} index={i} loading={loading} />
            ))}
          </div>

          {/* Live map / severity donut / performance — 3-panel row, height-locked */}
          {mapExpanded ? (
            <div className="mb-5">
              <PanelShell
                height={EXPANDED_MAP_HEIGHT}
                title="Live Alert Map"
                subtitle="All located alerts in the selected period"
                action={
                  <button
                    onClick={() => setMapExpanded(false)}
                    title="Collapse"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                  >
                    <Minimize2 size={15} />
                  </button>
                }
              >
                <AlertLiveMap alerts={filtered} loading={loading} />
              </PanelShell>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5 items-start">
              <div className="lg:col-span-5">
                <PanelShell
                  height={ROW1_HEIGHT}
                  title="Live Alert Map"
                  subtitle="All located alerts in the selected period"
                  action={
                    <button
                      onClick={() => setMapExpanded(true)}
                      title="Expand"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                    >
                      <Maximize2 size={15} />
                    </button>
                  }
                >
                  <AlertLiveMap alerts={filtered} loading={loading} />
                </PanelShell>
              </div>
              <div className="lg:col-span-4">
                <PanelShell
                  height={ROW1_HEIGHT}
                  title="Alert Severity Distribution"
                  subtitle="Breakdown by severity level"
                >
                  <AlertSeverityDonut alerts={filtered} loading={loading} />
                </PanelShell>
              </div>
              <div className="lg:col-span-3">
                <PanelShell
                  height={ROW1_HEIGHT}
                  title="Alert Performance"
                  subtitle={
                    quick
                      ? QUICK.find((q) => q.key === quick)?.label
                      : "Selected period"
                  }
                  scroll
                >
                  <AlertPerformanceContent
                    ackRate={ackRate}
                    resolvedRate={resolvedRate}
                    repeatRate={repeatRate}
                    slaBreachRate={slaBreachRate}
                    dailyVolume={dailyVolume}
                  />
                </PanelShell>
              </div>
            </div>
          )}

          {/* Categories + response status + critical list — height-locked row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5 items-start">
            <div className="lg:col-span-5">
              <PanelShell height={ROW2_HEIGHT} title="Alert Categories">
                <AlertCategoriesChart alerts={filtered} loading={loading} />
              </PanelShell>
            </div>
            <div className="lg:col-span-4">
              <PanelShell height={ROW2_HEIGHT} title="Response Status" scroll>
                <ResponseStatusCard
                  alerts={filtered}
                  getStatus={getStatus}
                  loading={loading}
                />
              </PanelShell>
            </div>
            <div className="lg:col-span-3">
              {/* CriticalAlertsListCard renders its own internal header, so it
                  gets a bare fixed-height Card (no PanelShell) to avoid a
                  duplicate header — but the outer box is still locked to
                  ROW2_HEIGHT so it aligns with its siblings. */}
              <Card
                hover
                className="flex flex-col"
                style={{ height: ROW2_HEIGHT, overflowY: "auto" }}
              >
                <CriticalAlertsListCard
                  alerts={filtered}
                  loading={loading}
                  onViewAll={scrollToTable}
                />
              </Card>
            </div>
          </div>

          {/* All Alerts table */}
          <Card id="alerts-table-section">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <StatusTabs
                value={statusTab}
                onChange={setStatusTab}
                counts={tabCounts}
              />
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={imeiFilter}
                  onChange={(e) => setImeiFilter(e.target.value)}
                  placeholder="Search alerts…"
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-primary w-48"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size={28} />
              </div>
            ) : pageRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Bell size={28} className="mb-2 text-slate-300" />
                <p className="text-sm">No alerts match this filter.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {[
                          "Alert ID",
                          "Type",
                          "Severity",
                          "Vehicle / Device",
                          "Location",
                          "Triggered At",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left text-slate-400 font-semibold whitespace-nowrap"
                          >
                            {h === "Triggered At" ? (
                              <span className="inline-flex items-center gap-1">
                                {h} <span className="text-slate-300">↓</span>
                              </span>
                            ) : (
                              h
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pageRows.map((a, i) => {
                        const { severity: sev, label: alertLabel } =
                          classifyAlert(a, typeLabel(a.type));
                        const sevMeta = SEVERITY_META[sev];
                        const status = getStatus(a.id);
                        const statusMeta = STATUS_META[status];
                        const globalIdx = (page - 1) * pageSize + i;
                        const friendlyId = `ALRT-${(a.createdOn || "").slice(0, 10).replace(/-/g, "")}-${String(globalIdx + 1).padStart(4, "0")}`;
                        return (
                          <tr
                            key={a.id ?? i}
                            className="hover:bg-slate-50 transition align-top"
                          >
                            <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                              {friendlyId}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                                style={{
                                  background: `${sevMeta.color}1a`,
                                  color: sevMeta.color,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: sevMeta.color }}
                                />
                                {alertLabel}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
                                style={{
                                  background: sevMeta.bg,
                                  color: sevMeta.text,
                                }}
                              >
                                {sevMeta.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="font-bold text-primary">
                                {a.vehicleNumber || "N/A"}
                              </div>
                              <div className="font-mono text-[10px] text-slate-400">
                                {a.imei}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 max-w-[220px]">
                              <span className="flex items-start gap-1">
                                <MapPin
                                  size={11}
                                  className="text-slate-400 shrink-0 mt-0.5"
                                />
                                <span
                                  className="line-clamp-1"
                                  title={a.message || undefined}
                                >
                                  {a.address || "No details"}
                                </span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="text-slate-400" />
                                {fmtDate(a.deviceTime || a.createdOn)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span
                                className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold"
                                style={{
                                  background: `${statusMeta.color}1a`,
                                  color: statusMeta.color,
                                }}
                              >
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                {a.latitude && a.longitude && (
                                  <button
                                    onClick={() => trackVehicle(a)}
                                    title="Track vehicle"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition"
                                  >
                                    <Eye size={13} />
                                  </button>
                                )}
                                <AlertActionsMenu
                                  status={status}
                                  onAcknowledge={() => acknowledge(a.id)}
                                  onResolve={() => resolve(a.id)}
                                  onReopen={() => reopen(a.id)}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    Showing {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, tableRows.length)} of{" "}
                    {formatNumber(tableRows.length)} alerts
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="ml-2 px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:border-primary"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n} / page
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p = i + 1;
                      if (totalPages > 5) {
                        const start = Math.max(
                          1,
                          Math.min(page - 2, totalPages - 4),
                        );
                        p = start + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            "w-7 h-7 rounded-lg text-xs font-bold transition",
                            p === page
                              ? "bg-primary text-white"
                              : "text-slate-500 hover:bg-slate-100",
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}