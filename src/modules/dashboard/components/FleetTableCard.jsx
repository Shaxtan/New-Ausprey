/**
 * FleetTableCard.jsx  — New-Ausprey Dashboard
 *
 * Displays two tabs:
 *   • VTS  — live vehicles from the dashboard API (VTS.available)
 *   • Unreachable — devices from the unreachable API
 *
 * Mirrors the old Ausprey "Projects" table functionality with the
 * New-Ausprey design system (Tailwind / shadcn-style).
 */
import { useMemo, useState } from "react";
import {
  Search,
  ExternalLink,
  Wifi,
  WifiOff,
  Play,
  PauseCircle,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, Tabs, Skeleton, StatusBadge } from "@/components/ui";
import { cn } from "@/utils";

// ─── Status helpers ───────────────────────────────────────────────────────────
function getVtsStatus(item) {
  const ignOn = (item.ign ?? "").toUpperCase() === "Y";
  const speed = Number(item.speed) || 0;
  const rawTs = item.devTs || item.cts;
  if (rawTs) {
    const diffMs = Date.now() - new Date(rawTs).getTime();
    if (diffMs > 60 * 60 * 1000) return "offline";
  }
  if (!ignOn) return "stopped";
  if (speed > 5) return "motion";
  return "idle";
}

const STATUS_META = {
  motion: {
    label: "Motion",
    color: "text-emerald-600 bg-emerald-50",
    dot: "bg-emerald-500",
  },
  idle: {
    label: "Idle",
    color: "text-amber-600  bg-amber-50",
    dot: "bg-amber-400",
  },
  stopped: {
    label: "Stopped",
    color: "text-blue-600   bg-blue-50",
    dot: "bg-blue-500",
  },
  offline: {
    label: "Offline",
    color: "text-slate-500  bg-slate-100",
    dot: "bg-slate-400",
  },
};

function StatusChip({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.offline;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold",
        m.color,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

// ─── Status filter bar ────────────────────────────────────────────────────────
const VTS_FILTERS = [
  { key: "all", label: "All" },
  { key: "motion", label: "Motion" },
  { key: "idle", label: "Idle" },
  { key: "stopped", label: "Stopped" },
  { key: "offline", label: "Offline" },
];

function FilterBar({ active, counts, onChange }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {VTS_FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-semibold transition",
            active === f.key
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200",
          )}
        >
          {f.label} <span className="opacity-70">({counts[f.key] ?? 0})</span>
        </button>
      ))}
    </div>
  );
}

// ─── VTS table ────────────────────────────────────────────────────────────────
function VtsTable({ rows, loading, onImeiClick }) {
  if (loading)
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  if (!rows.length)
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        No vehicles match your filter.
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {[
              "#",
              "Account",
              "Vehicle No.",
              "IMEI",
              "Power",
              "Date/Time",
              "Address",
              "Lat",
              "Lng",
              "GPS",
              "Ignition",
              "Speed",
              "Status",
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((r, i) => (
            <tr key={r.imei ?? i} className="hover:bg-slate-50/70 transition">
              <td className="px-3 py-2.5 text-xs text-slate-400 font-medium">
                {i + 1}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                {r.accountName || "—"}
              </td>
              <td className="px-3 py-2.5">
                <button
                  onClick={() => onImeiClick(r.imei, r.accid)}
                  className="text-xs font-bold text-primary hover:underline whitespace-nowrap"
                >
                  {r.vehnum || r.name || "—"}
                </button>
              </td>
              <td className="px-3 py-2.5">
                <button
                  onClick={() => onImeiClick(r.imei, r.accid)}
                  className="text-xs text-primary hover:underline font-mono"
                >
                  {r.imei}
                </button>
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    r.powsts === "Y" ? "text-emerald-600" : "text-rose-500",
                  )}
                >
                  {r.powsts === "Y" ? "Connected" : "Disconnected"}
                </span>
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                {r.devTs || r.cts || "—"}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[180px]">
                {r.address && r.address !== "NA" && r.address.trim() ? (
                  <span className="line-clamp-2">{r.address}</span>
                ) : r.lat && r.lng ? (
                  <a
                    href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open Maps <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="text-slate-300">No address</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">
                {r.lat?.toFixed(5) ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">
                {r.lng?.toFixed(5) ?? "—"}
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    r.gps === "A" ? "text-emerald-600" : "text-slate-400",
                  )}
                >
                  {r.gps === "A" ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    r.ign === "Y" ? "text-emerald-600" : "text-rose-500",
                  )}
                >
                  {r.ign === "Y" ? "On" : "Off"}
                </span>
              </td>
              <td className="px-3 py-2.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                {Number(r.speed) > 0 ? (
                  <span className="text-emerald-600">
                    {Number(r.speed).toFixed(1)} km/h
                  </span>
                ) : (
                  <span className="text-slate-400">0 km/h</span>
                )}
              </td>
              <td className="px-3 py-2.5">
                <StatusChip status={r._status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Unreachable table ────────────────────────────────────────────────────────
function UnreachableTable({ rows, loading, onImeiClick }) {
  if (loading)
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  if (!rows.length)
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        No unreachable devices found.
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {[
              "#",
              "Account",
              "Acc ID",
              "Vehicle No.",
              "IMEI",
              "Device Type",
              "Created On",
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((r, i) => (
            <tr key={r.imei ?? i} className="hover:bg-slate-50/70 transition">
              <td className="px-3 py-2.5 text-xs text-slate-400 font-medium">
                {i + 1}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                {r.accountName || "—"}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-500">
                {r.accid || "—"}
              </td>
              <td className="px-3 py-2.5">
                <button
                  onClick={() => onImeiClick(r.imei, r.accid)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {r.vehnum || r.name || "—"}
                </button>
              </td>
              <td className="px-3 py-2.5">
                <button
                  onClick={() => onImeiClick(r.imei, r.accid)}
                  className="text-xs text-primary hover:underline font-mono"
                >
                  {r.imei}
                </button>
              </td>
              <td className="px-3 py-2.5">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {r.deviceType || "—"}
                </span>
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                {r.createdOn ? new Date(r.createdOn).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function FleetTableCard({
  vtsData = [],
  unreachableData = [],
  loadingVts,
  loadingUnreachable,
}) {
  const navigate = useNavigate();

  const [tab, setTab] = useState("vts");
  const [vtsFilter, setVtsFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const handleImeiClick = (imei, accid) => {
    if (!imei || imei === "N/A") return;
    navigate(`/live-track?imei=${imei}`, {
      state: { targetImei: imei, targetAccountId: accid },
    });
  };

  // Annotate VTS rows with computed status
  const annotatedVts = useMemo(
    () => vtsData.map((item) => ({ ...item, _status: getVtsStatus(item) })),
    [vtsData],
  );

  // Count per status
  const vtsCounts = useMemo(
    () => ({
      all: annotatedVts.length,
      motion: annotatedVts.filter((r) => r._status === "motion").length,
      idle: annotatedVts.filter((r) => r._status === "idle").length,
      stopped: annotatedVts.filter((r) => r._status === "stopped").length,
      offline: annotatedVts.filter((r) => r._status === "offline").length,
    }),
    [annotatedVts],
  );

  // Filtered + searched VTS
  const filteredVts = useMemo(() => {
    const term = search.toLowerCase();
    return annotatedVts
      .filter((r) => vtsFilter === "all" || r._status === vtsFilter)
      .filter(
        (r) =>
          !term ||
          [r.vehnum, r.name, r.imei, r.accountName].some((f) =>
            (f ?? "").toLowerCase().includes(term),
          ),
      );
  }, [annotatedVts, vtsFilter, search]);

  // Searched unreachable
  const filteredUnreachable = useMemo(() => {
    const term = search.toLowerCase();
    return unreachableData.filter(
      (r) =>
        !term ||
        [r.vehnum, r.name, r.imei, r.accountName].some((f) =>
          (f ?? "").toLowerCase().includes(term),
        ),
    );
  }, [unreachableData, search]);

  // Pagination
  const activeRows = tab === "vts" ? filteredVts : filteredUnreachable;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = activeRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const resetPage = () => setPage(1);

  const TABS = [
    { value: "vts", label: `Live Vehicles (${vtsCounts.all})` },
    { value: "unreachable", label: `Unreachable (${unreachableData.length})` },
  ];

  return (
    <Card className="mt-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Fleet Device Report
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tab === "vts"
              ? `${filteredVts.length} vehicles${vtsFilter !== "all" ? ` (${vtsFilter})` : ""}`
              : `${filteredUnreachable.length} unreachable devices`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Search vehicle / IMEI..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-primary w-48"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={(v) => {
          setTab(v);
          resetPage();
          setSearch("");
        }}
        className="mb-4"
      />

      {/* VTS status filter bar */}
      {tab === "vts" && (
        <div className="mb-3">
          <FilterBar
            active={vtsFilter}
            counts={vtsCounts}
            onChange={(v) => {
              setVtsFilter(v);
              resetPage();
            }}
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        {tab === "vts" ? (
          <VtsTable
            rows={pagedRows}
            loading={loadingVts}
            onImeiClick={handleImeiClick}
          />
        ) : (
          <UnreachableTable
            rows={pagedRows}
            loading={loadingUnreachable}
            onImeiClick={handleImeiClick}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, activeRows.length)} of{" "}
            {activeRows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p =
                Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-7 h-7 rounded-lg text-xs font-semibold transition",
                    currentPage === p
                      ? "bg-primary text-white"
                      : "hover:bg-slate-100",
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default FleetTableCard;
