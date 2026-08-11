/**
 * DistanceReportPage.jsx — New-Ausprey
 *
 * Mirrors the old Ausprey DistanceReport page:
 *  - Searchable IMEI dropdown (from account-scoped dropdown API)
 *  - Start / End date pickers with Today / Yesterday / Last 7 Days quick selects
 *  - Summary cards: Vehicle No, IMEI, Total Distance, Avg Speed
 *  - Bar chart: Daily or Hourly Distance + Speed
 *  - Uses POST /usage/reports/distance-report
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ChevronDown,
  Calendar,
  RefreshCw,
  Truck,
  Gauge,
  Map,
  Hash,
} from "lucide-react";
import { PageHeader } from "@/components/common";
import { Card, Skeleton, Spinner } from "@/components/ui";
import { ExportMenu } from "@/components/common";
import { exportCSV, exportExcel, exportPDF } from "@/utils";
import { useAccountStore } from "@/store";
import apiService from "@/services/apiService";
import { cn } from "@/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");

/** Formats a Date to yyyy-mm-dd using LOCAL date parts (no UTC shift) */
const toLocalYmd = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const today = () => toLocalYmd(new Date());

/** Formats a yyyy-mm-dd date to d/MM/yyyy for the API payload */
const toApiDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return `${Number(d)}/${m}/${y}`;
};

const QUICK = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
];

function applyQuick(key, setStart, setEnd) {
  const now = new Date();
  let s = new Date(),
    e = new Date();
  if (key === "today") {
    /* both = today */
  }
  if (key === "yesterday") {
    s.setDate(now.getDate() - 1);
    e.setDate(now.getDate() - 1);
  }
  if (key === "last7") {
    s.setDate(now.getDate() - 7); /* end = today */
  }
  setStart(toLocalYmd(s));
  setEnd(toLocalYmd(e));
}

// ─── IMEI searchable combobox ─────────────────────────────────────────────────
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
          <span className="text-slate-400 flex-1">Search vehicle / IMEI…</span>
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

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, iconBg, iconColor, loading }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">{label}</div>
          {loading ? (
            <Skeleton className="h-5 w-24 mt-1" />
          ) : (
            <div className="text-base font-extrabold text-slate-800">
              {value ?? "—"}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 12,
};

function DistanceChart({ data, xKey, isSingleDay }) {
  const fmt = (v) => {
    if (v === null || v === undefined) return "";
    if (isSingleDay) return `${v}:00`;
    return new Date(v).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f1f5f9"
        />
        <XAxis
          dataKey={xKey}
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          interval={isSingleDay ? 0 : "preserveStartEnd"}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmt} />
        <Legend
          verticalAlign="top"
          align="right"
          wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
        />
        <Bar
          name="Distance (km)"
          dataKey="distance"
          fill="#0ea5e9"
          radius={[4, 4, 0, 0]}
          barSize={isSingleDay ? 12 : 22}
        />
        <Bar
          name="Speed (km/h)"
          dataKey="speed"
          fill="#f97316"
          radius={[4, 4, 0, 0]}
          barSize={isSingleDay ? 12 : 22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DistanceReportPage() {
  const accid = useAccountStore((s) => s.selectedAccount?.id ?? 1);
  const location = useLocation();

  // Pre-fill from navigation state (e.g. clicking a vehicle in the
  // dashboard's "Top by Distance" chart, or the chatbot's OPEN_REPORT
  // action). Consumed once via the ref below so a later manual IMEI
  // change isn't clobbered by a stale navigation state on re-render.
  const targetImei = location.state?.targetImei;
  const targetVehicleLabel = location.state?.targetVehicleLabel;
  const consumedTargetRef = useRef(false);
  const autoFetchedRef = useRef(false);

  const [imeiList, setImeiList] = useState([]);
  const [imeiLoading, setImeiLoading] = useState(false);
  const [imei, setImei] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [quick, setQuick] = useState("today");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Committed dates (locked when Refresh is clicked — matches old project)
  const [committed, setCommitted] = useState({ start: today(), end: today() });

  // Load IMEI list on account change
  useEffect(() => {
    setImei("");
    setImeiList([]);
    setImeiLoading(true);
    apiService
      .getImeiDropdown(accid)
      .then((list) => {
        const opts = list.map((item) => ({
          value: item.imei,
          label: item.vehnum ? `${item.vehnum} (${item.imei})` : item.imei,
        }));

        // If we arrived here with a target vehicle (dashboard click / chat
        // action) and haven't consumed it yet, select that one instead of
        // defaulting to the first vehicle in the list. Inject it as a
        // synthetic option if the account-scoped dropdown doesn't happen
        // to include it, so the select shows a real label instead of blank.
        if (targetImei && !consumedTargetRef.current) {
          consumedTargetRef.current = true;
          const alreadyPresent = opts.some((o) => o.value === targetImei);
          const finalOpts = alreadyPresent
            ? opts
            : [
                {
                  value: targetImei,
                  label: targetVehicleLabel
                    ? `${targetVehicleLabel} (${targetImei})`
                    : targetImei,
                },
                ...opts,
              ];
          setImeiList(finalOpts);
          setImei(targetImei);
        } else {
          setImeiList(opts);
          if (opts.length) setImei(opts[0].value);
        }
        setImeiLoading(false);
      })
      .catch(() => setImeiLoading(false));
  }, [accid, targetImei, targetVehicleLabel]);

  // Auto-fetch is wired in just below fetchReport's declaration.

  const handleQuick = (key) => {
    setQuick(key);
    applyQuick(key, setStartDate, setEndDate);
  };

  const fetchReport = async () => {
    setError("");
    if (!imei) {
      setError("Please select a vehicle / IMEI.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select start and end dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setCommitted({ start: startDate, end: endDate });
    try {
      const res = await apiService.getDistanceReport({
        imei,
        startDate: toApiDate(startDate),
        endDate: toApiDate(endDate),
      });
      setReportData(res?.data ?? null);
    } catch (e) {
      setError(e?.message ?? "Failed to fetch report.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch once the target vehicle's IMEI (from a dashboard click or
  // the chatbot's OPEN_REPORT action) has actually been applied to `imei`.
  useEffect(() => {
    if (targetImei && imei === targetImei && !autoFetchedRef.current) {
      autoFetchedRef.current = true;
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imei, targetImei]);

  // Determine whether it's a single day (hourly) or multi-day (daily)
  const isSingleDay = useMemo(
    () => committed.start === committed.end,
    [committed],
  );
  const xKey = isSingleDay ? "hr" : "repDate";

  const chartData = useMemo(() => {
    const raw = reportData?.vehicleDistances ?? [];
    return raw.filter((r) => r[xKey] !== null && r[xKey] !== undefined);
  }, [reportData, xKey]);

  const firstRow = reportData?.vehicleDistances?.[0];

  // ── Export helpers ──────────────────────────────────────────────────────────
  const exportRows = useMemo(() => {
    const label = isSingleDay ? "Hour" : "Date";
    return chartData.map((r) => ({
      [label]: isSingleDay ? `${r.hr}:00` : r.repDate,
      "Vehicle No": firstRow?.vehNum ?? "",
      IMEI: reportData?.imei ?? imei ?? "",
      "Distance (km)": r.distance ?? 0,
      "Speed (km/h)": r.speed ?? 0,
    }));
  }, [chartData, isSingleDay, firstRow, reportData, imei]);

  const exportCols = useMemo(
    () => [
      {
        key: isSingleDay ? "Hour" : "Date",
        label: isSingleDay ? "Hour" : "Date",
        width: 12,
      },
      { key: "Vehicle No", label: "Vehicle No", width: 18 },
      { key: "IMEI", label: "IMEI", width: 20 },
      { key: "Distance (km)", label: "Distance (km)", width: 14 },
      { key: "Speed (km/h)", label: "Speed (km/h)", width: 14 },
    ],
    [isSingleDay],
  );

  const exportMeta = {
    title: `Distance Report — ${firstRow?.vehNum ?? imei}`,
    subtitle:
      committed.start === committed.end
        ? committed.start
        : `${committed.start} → ${committed.end}`,
  };

  const handleExportCSV = () =>
    exportCSV(exportRows, `distance_report_${imei}.csv`, exportCols);
  const handleExportExcel = () =>
    exportExcel(
      exportRows,
      `distance_report_${imei}.xlsx`,
      exportCols,
      "Distance Report",
    );
  const handleExportPDF = () =>
    exportPDF(exportRows, `distance_report_${imei}`, exportCols, exportMeta);

  const summaryCards = [
    {
      icon: Truck,
      label: "Vehicle Number",
      value: firstRow?.vehNum ?? "—",
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      icon: Hash,
      label: "IMEI",
      value: reportData?.imei ?? imei ?? "—",
      iconBg: "#ecfdf5",
      iconColor: "#16a34a",
    },
    {
      icon: Map,
      label: "Total Distance",
      value: reportData ? `${reportData.totalDistanceKm} km` : "—",
      iconBg: "#eef2ff",
      iconColor: "#4f46e5",
    },
    {
      icon: Gauge,
      label: "Avg Speed",
      value: reportData ? `${reportData.avgSpeed} km/h` : "—",
      iconBg: "#fff7ed",
      iconColor: "#f97316",
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={["Reports", "Distance Report"]}
        title="Distance Report"
        description="Daily or hourly distance travelled and average speed per vehicle."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              disabled={!reportData || chartData.length === 0}
              onCSV={handleExportCSV}
              onExcel={handleExportExcel}
              onPDF={handleExportPDF}
            />
            <button
              onClick={fetchReport}
              disabled={loading || !imei}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition",
                loading || !imei
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
          {/* IMEI */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Vehicle / IMEI <span className="text-rose-500">*</span>
            </label>
            <ImeiSelect
              options={imeiList}
              value={imei}
              onChange={setImei}
              loading={imeiLoading}
            />
          </div>

          {/* Start date */}
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

          {/* End date */}
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

          {/* Search button */}
          <button
            onClick={fetchReport}
            disabled={loading || !imei}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition",
              loading || !imei
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover",
            )}
          >
            <Search size={15} />
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Quick selects */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
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

        {/* Error */}
        {error && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium">
            {error}
          </div>
        )}
      </Card>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {summaryCards.map((c) => (
          <SummaryCard key={c.label} {...c} loading={loading} />
        ))}
      </div>

      {/* ── Chart ── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {isSingleDay
                ? "Hourly Distance & Speed"
                : "Daily Distance & Speed"}
            </h3>
            {reportData && (
              <p className="text-xs text-slate-400 mt-0.5">
                {committed.start === committed.end
                  ? committed.start
                  : `${committed.start} → ${committed.end}`}
                {" · "}
                {chartData.length} records
              </p>
            )}
          </div>
          {loading && <Spinner size={18} />}
        </div>

        {loading && !reportData && (
          <div className="flex items-center justify-center py-16">
            <Spinner size={32} />
          </div>
        )}

        {!loading && !reportData && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400 text-center max-w-xs">
              Select a vehicle and date range, then click Search to generate the
              report.
            </p>
          </div>
        )}

        {!loading && reportData && chartData.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">
              No data found for the selected range.
            </p>
          </div>
        )}

        {chartData.length > 0 && (
          <DistanceChart
            data={chartData}
            xKey={xKey}
            isSingleDay={isSingleDay}
          />
        )}
      </Card>
    </div>
  );
}
