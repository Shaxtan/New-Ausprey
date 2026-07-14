/**
 * AlertsPage.jsx — New-Ausprey "Alert Dashboard"
 *
 * Real implementation against POST /usage/alerts/by-account.
 *
 * Adds, on top of the existing account/date-range filter + search that
 * already worked:
 *   - 5 KPI cards (Total / Critical / Acknowledged / Resolved / Repeat)
 *   - Live alert map + severity donut
 *   - Alert-categories bar chart + local response-status breakdown + a
 *     critical-alerts quick list
 *   - A full "All Alerts" table with status tabs, search, pagination,
 *     and per-row Acknowledge/Resolve actions
 *
 * IMPORTANT: severity is DERIVED from alert `type` (see utils/alertSeverity.js)
 * because the API doesn't return one. Acknowledge/Resolve status is tracked
 * LOCALLY in this browser (see hooks/useAlertTriage.js) because there is no
 * backend alert-workflow endpoint — this is surfaced honestly in the UI
 * rather than implied as server-synced.
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  MapPin,
  Clock,
  AlertOctagon,
  CheckCircle2,
  ShieldCheck,
  Repeat,
  ExternalLink,
  Eye,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader, KpiCard, ExportMenu, Trend } from "@/components/common";
import { Card, CardHeader, Skeleton, Spinner, Tabs } from "@/components/ui";
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

  // ── KPI derivations ──────────────────────────────────────────────────────────
  // classifyAlert is used everywhere (here, the charts, the table) so severity
  // counts can never disagree with what's shown per-row.
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of filtered) {
      const { severity } = classifyAlert(a, typeLabel(a.type));
      counts[severity] = (counts[severity] ?? 0) + 1;
    }
    return counts;
  }, [filtered]);

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

  const pctOfTotal = (n) =>
    total ? `${((n / total) * 100).toFixed(1)}% of total` : "—";

  // Row 1 — severity breakdown (the primary ask: Critical/High/Medium/Low counts)
  const severityKpis = [
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
      label: "Critical",
      value: formatNumber(severityCounts.critical),
      trend: <Trend value={pctOfTotal(severityCounts.critical)} neutral />,
    },
    {
      icon: AlertOctagon,
      iconBg: SEVERITY_META.high.bg,
      iconColor: SEVERITY_META.high.color,
      label: "High",
      value: formatNumber(severityCounts.high),
      trend: <Trend value={pctOfTotal(severityCounts.high)} neutral />,
    },
    {
      icon: AlertOctagon,
      iconBg: SEVERITY_META.medium.bg,
      iconColor: SEVERITY_META.medium.color,
      label: "Medium",
      value: formatNumber(severityCounts.medium),
      trend: <Trend value={pctOfTotal(severityCounts.medium)} neutral />,
    },
    {
      icon: AlertOctagon,
      iconBg: SEVERITY_META.low.bg,
      iconColor: SEVERITY_META.low.color,
      label: "Low",
      value: formatNumber(severityCounts.low),
      trend: <Trend value={pctOfTotal(severityCounts.low)} neutral />,
    },
  ];

  // Row 2 — local triage breakdown (unchanged functionality, just moved to its own row)
  const triageKpis = [
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
      label: "Resolved",
      value: formatNumber(resolvedCount),
      trend: <Trend value="Tracked locally" neutral />,
    },
    {
      icon: Repeat,
      iconBg: "#fef3c7",
      iconColor: "#d97706",
      label: "Repeat Alerts",
      value: formatNumber(repeatVehicles),
      trend: <Trend value="Vehicles with 2+ alerts" neutral />,
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
          {/* KPI row — severity breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
            {severityKpis.map((k, i) => (
              <KpiCard key={k.label} {...k} index={i} loading={loading} />
            ))}
          </div>

          {/* KPI row — local triage breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {triageKpis.map((k, i) => (
              <KpiCard key={k.label} {...k} index={i + 5} loading={loading} />
            ))}
          </div>

          {/* Live map + severity donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
            <div className="lg:col-span-8">
              <Card hover>
                <CardHeader
                  title="Live Alert Map"
                  subtitle="All located alerts in the selected period"
                />
                <AlertLiveMap alerts={filtered} loading={loading} />
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card hover>
                <CardHeader title="Alert Severity Distribution" />
                <AlertSeverityDonut alerts={filtered} loading={loading} />
              </Card>
            </div>
          </div>

          {/* Categories + response status + critical list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
            <div className="lg:col-span-5">
              <Card hover>
                <CardHeader title="Alert Categories" />
                <AlertCategoriesChart alerts={filtered} loading={loading} />
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card hover>
                <CardHeader title="Response Status" />
                <ResponseStatusCard
                  alerts={filtered}
                  getStatus={getStatus}
                  loading={loading}
                />
              </Card>
            </div>
            <div className="lg:col-span-3">
              <Card hover>
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
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-sm font-bold text-slate-800">All Alerts</h3>
                <Tabs
                  value={statusTab}
                  onChange={setStatusTab}
                  tabs={[
                    { value: "all", label: `All (${tabCounts.all})` },
                    { value: "open", label: `Open (${tabCounts.open})` },
                    {
                      value: "acknowledged",
                      label: `Ack (${tabCounts.acknowledged})`,
                    },
                    {
                      value: "resolved",
                      label: `Resolved (${tabCounts.resolved})`,
                    },
                  ]}
                />
              </div>
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
                          "Message",
                          "Triggered At",
                          "Status",
                          "Actions",
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
                                <span className="line-clamp-1">
                                  {a.address || "No details"}
                                </span>
                              </span>
                            </td>
                            <td
                              className="px-3 py-2.5 text-slate-500 max-w-[240px]"
                              title={a.message || undefined}
                            >
                              {a.message ? (
                                <span className="text-[11px] italic line-clamp-2">
                                  {a.message}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
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
                              <div className="flex items-center gap-1.5">
                                {a.latitude && a.longitude && (
                                  <button
                                    onClick={() => trackVehicle(a)}
                                    title="Track vehicle"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition"
                                  >
                                    <Eye size={13} />
                                  </button>
                                )}
                                {status === "open" && (
                                  <button
                                    onClick={() => acknowledge(a.id)}
                                    title="Acknowledge"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                  >
                                    <Check size={13} />
                                  </button>
                                )}
                                {status === "acknowledged" && (
                                  <button
                                    onClick={() => resolve(a.id)}
                                    title="Resolve"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                                  >
                                    <ShieldCheck size={13} />
                                  </button>
                                )}
                                {status !== "open" && (
                                  <button
                                    onClick={() => reopen(a.id)}
                                    title="Reopen"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  >
                                    <RotateCcw size={13} />
                                  </button>
                                )}
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
