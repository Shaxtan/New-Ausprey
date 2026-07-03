/**
 * StoppageReportPage.jsx — New-Ausprey
 *
 * Detects vehicle stoppages by fetching track-play history and clustering
 * consecutive STOP points (speed === 0, ign off).
 *
 * Algorithm:
 *   1. Fetch raw track points via getTrackPlayHistory
 *   2. Walk the sorted point array — when status = 'STOP' start a cluster
 *   3. Continue the cluster while consecutive points stay STOP
 *   4. When a non-STOP point (or end of array) is hit, close the cluster:
 *        - start = first point's ts
 *        - end   = last point's ts
 *        - duration = end - start (ms → hh:mm:ss)
 *        - location = first point's lat/lng (where vehicle stopped)
 *   5. Filter clusters shorter than MIN_DURATION (default 2 min) to
 *      remove brief traffic-light / sensor-jitter stops
 *
 * Output table: No · Start Time · End Time · Duration · Location (maps link)
 * + summary KPI cards: Total stops, Longest stop, Total stopped time
 * + Export (CSV / Excel / PDF)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  Calendar,
  RefreshCw,
  ParkingCircle,
  Clock,
  Timer,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/common";
import { ExportMenu } from "@/components/common";
import { Card, Skeleton, Spinner } from "@/components/ui";
import { exportCSV, exportExcel, exportPDF } from "@/utils";
import apiService from "@/services/apiService";
import { useAccountStore } from "@/store";
import { cn } from "@/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const toLocalYmd = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toLocalInput = (d) =>
  `${toLocalYmd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const today = () => toLocalYmd(new Date());

const fmtTs = (s) => {
  if (!s) return "—";
  const d = new Date(s.replace?.(" ", "T") ?? s);
  if (isNaN(d)) return s;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const fmtDuration = (ms) => {
  if (!ms || ms < 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
};

// Min stop duration to surface in the report (filters traffic-light stops)
const MIN_DURATION_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Core stoppage detection — pure function, no React.
 * @param {Array} points — normalised points from getTrackPlayHistory
 * @returns {Array} stoppages [{ no, start, end, durationMs, lat, lng, name }]
 */
function detectStoppages(points) {
  if (!points?.length) return [];

  // Sort by timestamp ascending
  const sorted = [...points].sort((a, b) => new Date(a.ts) - new Date(b.ts));

  const stoppages = [];
  let clusterStart = null;
  let clusterEnd = null;

  const closeCluster = () => {
    if (!clusterStart) return;
    const startEpoch = new Date(clusterStart.ts).getTime();
    const endEpoch = new Date(clusterEnd.ts).getTime();
    const durationMs = endEpoch - startEpoch;
    if (durationMs >= MIN_DURATION_MS) {
      stoppages.push({
        start: clusterStart.ts,
        end: clusterEnd.ts,
        durationMs,
        lat: clusterStart.lat,
        lng: clusterStart.lng,
        name: clusterStart.name,
        pointCount: stoppages._tmp_count ?? 1,
      });
    }
    clusterStart = null;
    clusterEnd = null;
  };

  for (const pt of sorted) {
    if (pt.status === "STOP") {
      if (!clusterStart) {
        clusterStart = pt;
      }
      clusterEnd = pt;
    } else {
      closeCluster();
    }
  }
  closeCluster(); // flush last cluster

  return stoppages.map((s, i) => ({ ...s, no: i + 1 }));
}

// ─── Quick range presets ───────────────────────────────────────────────────────
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

// ─── IMEI searchable dropdown (same as DistanceReportPage) ───────────────────
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

// ─── KPI summary card ─────────────────────────────────────────────────────────
function KpiTile({ icon: Icon, label, value, iconBg, iconColor, loading }) {
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

// ─── Duration badge ───────────────────────────────────────────────────────────
function DurationBadge({ ms }) {
  const color =
    ms >= 60 * 60 * 1000
      ? "bg-rose-50 text-rose-600" // ≥ 1 h
      : ms >= 15 * 60 * 1000
        ? "bg-amber-50 text-amber-600" // ≥ 15 min
        : "bg-slate-100 text-slate-600";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
        color,
      )}
    >
      <Timer size={10} />
      {fmtDuration(ms)}
    </span>
  );
}

// ─── Export columns ───────────────────────────────────────────────────────────
const EXPORT_COLS = [
  { key: "no", label: "No", width: 6 },
  { key: "vehicle", label: "Vehicle", width: 18 },
  { key: "start", label: "Start Time", width: 22 },
  { key: "end", label: "End Time", width: 22 },
  { key: "duration", label: "Duration", width: 14 },
  { key: "lat", label: "Latitude", width: 14 },
  { key: "lng", label: "Longitude", width: 14 },
  { key: "mapsLink", label: "Maps Link", width: 50 },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StoppageReportPage() {
  const accid = useAccountStore((s) => s.selectedAccount?.id ?? 1);

  const [imeiList, setImeiList] = useState([]);
  const [imeiLoading, setImeiLoading] = useState(false);
  const [imei, setImei] = useState("");
  const [vehName, setVehName] = useState("");
  const [fromDate, setFromDate] = useState(() =>
    toLocalInput(Object.assign(new Date(), {})),
  );
  const [toDate, setToDate] = useState("");
  const [quick, setQuick] = useState(null);
  const [minDur, setMinDur] = useState(2); // minutes

  const [stoppages, setStoppages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);
  const [search, setSearch] = useState("");

  // Init dates to today
  useEffect(() => {
    const { from, to } = applyQuick("today");
    setFromDate(from);
    setToDate(to);
    setQuick("today");
  }, []);

  // Load IMEI list on account change
  useEffect(() => {
    setImei("");
    setImeiList([]);
    setImeiLoading(true);
    apiService
      .getImeiDropdown(accid)
      .then((list) => {
        const opts = list
          .map((v) => ({
            value: v.imei,
            label: v.vehnum ? `${v.vehnum} (${v.imei})` : v.imei,
            vehnum: v.vehnum,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setImeiList(opts);
        if (opts.length) {
          setImei(opts[0].value);
          setVehName(opts[0].vehnum ?? opts[0].value);
        }
      })
      .catch(() => {})
      .finally(() => setImeiLoading(false));
  }, [accid]);

  const handleQuick = (key) => {
    setQuick(key);
    const { from, to } = applyQuick(key);
    setFromDate(from);
    setToDate(to);
  };

  const handleImeiChange = (val) => {
    setImei(val);
    const opt = imeiList.find((o) => o.value === val);
    setVehName(opt?.vehnum ?? val);
  };

  // ── Fetch + detect ──────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    setError("");
    if (!imei) {
      setError("Please select a vehicle / IMEI.");
      return;
    }
    if (!fromDate || !toDate) {
      setError("Please select both dates.");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setFetched(true);
    setStoppages([]);
    try {
      const points = await apiService.getTrackPlayHistory({
        imei,
        startTime: new Date(fromDate).toISOString(),
        endTime: new Date(toDate).toISOString(),
      });
      const minMs = minDur * 60 * 1000;
      const raw = detectStoppages(points);
      const filtered = raw.filter((s) => s.durationMs >= minMs);
      setStoppages(filtered);
    } catch (e) {
      setError(e?.message ?? "Failed to fetch track data.");
    } finally {
      setLoading(false);
    }
  }, [imei, fromDate, toDate, minDur]);

  // ── Filtered by search ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return stoppages;
    return stoppages.filter(
      (s) =>
        fmtTs(s.start).includes(term) ||
        fmtTs(s.end).includes(term) ||
        fmtDuration(s.durationMs).toLowerCase().includes(term),
    );
  }, [stoppages, search]);

  // ── Summary KPIs ────────────────────────────────────────────────────────────
  const totalStops = filtered.length;
  const totalMs = filtered.reduce((sum, s) => sum + s.durationMs, 0);
  const longestMs = filtered.length
    ? Math.max(...filtered.map((s) => s.durationMs))
    : 0;

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportRows = useMemo(
    () =>
      filtered.map((s) => ({
        no: s.no,
        vehicle: vehName || imei,
        start: fmtTs(s.start),
        end: fmtTs(s.end),
        duration: fmtDuration(s.durationMs),
        lat: s.lat != null ? Number(s.lat).toFixed(5) : "—",
        lng: s.lng != null ? Number(s.lng).toFixed(5) : "—",
        mapsLink:
          s.lat && s.lng
            ? `https://www.google.com/maps?q=${s.lat},${s.lng}`
            : "—",
      })),
    [filtered, vehName, imei],
  );

  const stamp = () => new Date().toISOString().slice(0, 10);
  const exportMeta = {
    title: `Stoppage Report — ${vehName || imei}`,
    subtitle: `${fromDate ? fmtTs(fromDate.replace("T", " ") + ":00") : ""} → ${toDate ? fmtTs(toDate.replace("T", " ") + ":00") : ""} · min duration ${minDur} min`,
  };

  const handleExportCSV = () =>
    exportCSV(exportRows, `stoppage_${imei}_${stamp()}.csv`, EXPORT_COLS);
  const handleExportExcel = () =>
    exportExcel(
      exportRows,
      `stoppage_${imei}_${stamp()}.xlsx`,
      EXPORT_COLS,
      "Stoppage Report",
    );
  const handleExportPDF = () =>
    exportPDF(
      exportRows,
      `stoppage_${imei}_${stamp()}`,
      EXPORT_COLS,
      exportMeta,
    );

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={["Reports", "Stoppage Report"]}
        title="Stoppage Report"
        description="Detects where a vehicle stopped, for how long, and maps each stop location."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              disabled={filtered.length === 0}
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
              onChange={handleImeiChange}
              loading={imeiLoading}
            />
          </div>

          {/* From datetime */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Start Date &amp; Time
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
              End Date &amp; Time
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
            disabled={loading || !imei}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition",
              loading || !imei
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover",
            )}
          >
            <Search size={15} />
            {loading ? "Detecting…" : "Find Stoppages"}
          </button>
        </div>

        {/* Quick selects + min duration */}
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

          {/* Min duration filter */}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Min duration:
            </label>
            <select
              value={minDur}
              onChange={(e) => setMinDur(Number(e.target.value))}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:border-primary"
            >
              <option value={1}>1 min</option>
              <option value={2}>2 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium">
            {error}
          </div>
        )}
      </Card>

      {/* ── KPI summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <KpiTile
          icon={ParkingCircle}
          label="Total Stops"
          value={fetched ? totalStops : "—"}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          loading={loading}
        />
        <KpiTile
          icon={Clock}
          label="Total Stopped Time"
          value={fetched ? fmtDuration(totalMs) : "—"}
          iconBg="#fff7ed"
          iconColor="#f97316"
          loading={loading}
        />
        <KpiTile
          icon={Timer}
          label="Longest Stop"
          value={fetched ? fmtDuration(longestMs) : "—"}
          iconBg="#fdf2f8"
          iconColor="#a21caf"
          loading={loading}
        />
      </div>

      {/* ── Results table ── */}
      <Card>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Stoppage Events
              <span className="text-slate-400 font-normal ml-1">
                ({filtered.length})
              </span>
            </h3>
            {fetched && !loading && stoppages.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                {vehName || imei} · stops ≥ {minDur} min
              </p>
            )}
          </div>
          {fetched && filtered.length > 0 && (
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter results…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-primary w-44"
              />
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size={28} />
            <p className="text-xs text-slate-400">
              Fetching track data and detecting stoppages…
            </p>
          </div>
        )}

        {/* Empty — not searched yet */}
        {!loading && !fetched && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ParkingCircle size={32} className="mb-2 text-slate-300" />
            <p className="text-sm">
              Select a vehicle and date range, then click Find Stoppages.
            </p>
          </div>
        )}

        {/* No stoppages found */}
        {!loading && fetched && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ParkingCircle size={32} className="mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No stoppages found</p>
            <p className="text-xs mt-1 text-center max-w-xs">
              {search
                ? "No results match your filter."
                : `No stops ≥ ${minDur} min detected. Try a longer time range or lower the minimum duration.`}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["#", "Start Time", "End Time", "Duration", "Location"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-left text-slate-400 font-semibold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s) => (
                  <tr
                    key={s.no}
                    className="hover:bg-slate-50 transition align-middle"
                  >
                    <td className="px-3 py-3 font-bold text-slate-400">
                      {s.no}
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        {fmtTs(s.start)}
                      </span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        {fmtTs(s.end)}
                      </span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <DurationBadge ms={s.durationMs} />
                    </td>

                    <td className="px-3 py-3">
                      {s.lat && s.lng ? (
                        <a
                          href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                          title={`${Number(s.lat).toFixed(5)}, ${Number(s.lng).toFixed(5)}`}
                        >
                          <MapPin size={11} className="shrink-0" />
                          {Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}
                          <ExternalLink size={10} className="text-slate-400" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table footer summary */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              <span>
                {filtered.length} stop{filtered.length !== 1 ? "s" : ""}
              </span>
              <span className="font-semibold">
                Total stopped:{" "}
                <span className="text-slate-800">{fmtDuration(totalMs)}</span>
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
