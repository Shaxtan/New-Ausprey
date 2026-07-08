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
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import {
  Search,
  ExternalLink,
  Building2,
  X,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, Tabs, Skeleton } from "@/components/ui";
import { cn, exportCSV, exportExcel, exportPDF } from "@/utils";
import { ExportMenu } from "@/components/common";
import { VehicleDrawer } from "./VehicleDrawer";
import apiService from "@/services/apiService";
import { useAccountStore } from "@/store";
import { useFleetTableStore } from "@/store/useFleetTableStore";

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
    color: "text-rose-600   bg-rose-50",
    dot: "bg-rose-500",
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

// ─── Account status popup ─────────────────────────────────────────────────────
function AccountPopup({ name, data, loading, error, anchorRef, onClose }) {
  const popupRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const statusLabel =
    data?.status === "A"
      ? "Active"
      : data?.status === "I"
        ? "Inactive"
        : (data?.status ?? "—");
  const isActive = data?.status === "A";

  return (
    <div
      ref={popupRef}
      className="absolute z-[9999] left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-3 animate-fade-in"
      style={{ minWidth: 210 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Building2 size={13} className="text-primary" />
          <span className="text-xs font-bold text-slate-700">Account Info</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <X size={13} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
          <Loader2 size={13} className="animate-spin" /> Fetching…
        </div>
      )}

      {error && !loading && (
        <div className="text-xs text-rose-500 py-1">{error}</div>
      )}

      {data && !loading && (
        <div className="space-y-1.5">
          <Row label="Name" value={data.name ?? "—"} />
          <Row label="ID" value={data.id ?? "—"} />
          <Row label="Type" value={data.type ?? "—"} />
          <Row label="Parent" value={data.parentAccountId ?? "—"} />
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Status</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-600",
              )}
            >
              {isActive ? <CheckCircle size={11} /> : <XCircle size={11} />}
              {statusLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="text-[11px] font-semibold text-slate-700">
        {String(value)}
      </span>
    </div>
  );
}

// Hook: resolves accountName → accountId via dropdown cache, then fetches status
function useAccountPopup() {
  const accounts = useAccountStore((s) => s.accounts); // already loaded
  const [popup, setPopup] = useState(null); // { name, data, loading, error, anchorRef }

  const open = useCallback(
    async (accountName, anchorRef) => {
      if (!accountName || accountName === "—") return;

      // Find account id from the dropdown cache
      const found = accounts.find(
        (a) =>
          (a.label ?? a.name ?? "").toLowerCase() === accountName.toLowerCase(),
      );

      setPopup({
        name: accountName,
        data: null,
        loading: true,
        error: null,
        anchorRef,
      });

      if (!found) {
        setPopup((p) => ({
          ...p,
          loading: false,
          error: `Account "${accountName}" not found in dropdown.`,
        }));
        return;
      }

      try {
        const data = await apiService.getAccountStatus(found.id);
        setPopup((p) => ({ ...p, data, loading: false }));
      } catch (e) {
        setPopup((p) => ({
          ...p,
          loading: false,
          error: e?.message ?? "Failed to load account.",
        }));
      }
    },
    [accounts],
  );

  const close = useCallback(() => setPopup(null), []);

  return { popup, open, close };
}

// Clickable account name cell
function AccountNameCell({ name, onOpen }) {
  const ref = useRef(null);
  if (!name || name === "—")
    return <span className="text-xs text-slate-400">—</span>;
  return (
    <button
      ref={ref}
      onClick={() => onOpen(name, ref)}
      className="text-xs font-medium text-primary hover:underline whitespace-nowrap text-left"
    >
      {name}
    </button>
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
function VtsTable({ rows, loading, onImeiClick, onAccountClick, onRowClick }) {
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
            <tr
              key={r.imei ?? i}
              className="hover:bg-primary/5 transition cursor-pointer"
              onClick={() => onRowClick?.(r)}
              title={`View details for ${r.vehnum || r.name || r.imei}`}
            >
              <td className="px-3 py-2.5 text-xs text-slate-400 font-medium">
                {i + 1}
              </td>
              <td
                className="px-3 py-2.5 whitespace-nowrap relative"
                onClick={(e) => e.stopPropagation()}
              >
                <AccountNameCell name={r.accountName} onOpen={onAccountClick} />
              </td>
              <td className="px-3 py-2.5">
                <button className="text-xs font-bold text-primary hover:underline whitespace-nowrap">
                  {r.vehnum || r.name || "—"}
                </button>
              </td>
              <td className="px-3 py-2.5">
                <button className="text-xs text-primary hover:underline font-mono">
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
function UnreachableTable({ rows, loading, onImeiClick, onAccountClick }) {
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
              <td className="px-3 py-2.5 whitespace-nowrap relative">
                <AccountNameCell name={r.accountName} onOpen={onAccountClick} />
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
  const {
    popup,
    open: openAccountPopup,
    close: closeAccountPopup,
  } = useAccountPopup();

  const [tab, setTab] = useState("vts");
  const [vtsFilter, setVtsFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // ── Vehicle drawer — driven by both row clicks AND chatbot actions ──────────
  const drawerImei = useFleetTableStore((s) => s.drawerImei);
  const drawerVehicleGlobal = useFleetTableStore((s) => s.drawerVehicle);
  const setGlobalVehicle = useFleetTableStore((s) => s.setDrawerVehicle);
  const closeGlobalDrawer = useFleetTableStore((s) => s.closeDrawer);
  const [localDrawerVehicle, setLocalDrawerVehicle] = useState(null);

  // When chatbot opens a drawer by IMEI, find that vehicle in vtsData
  useEffect(() => {
    if (!drawerImei) {
      setLocalDrawerVehicle(null);
      return;
    }
    const found = vtsData.find(
      (v) => v.imei === drawerImei || v.id === drawerImei,
    );
    if (found) {
      setLocalDrawerVehicle({ ...found, _status: getVtsStatus(found) });
      setGlobalVehicle(found);
    }
  }, [drawerImei, vtsData, setGlobalVehicle]);

  const drawerVehicle = localDrawerVehicle;
  const closeDrawer = () => {
    setLocalDrawerVehicle(null);
    closeGlobalDrawer();
  };

  // ── Pending filters from chatbot ───────────────────────────────────────────
  const pendingTab = useFleetTableStore((s) => s.pendingTab);
  const pendingFilter = useFleetTableStore((s) => s.pendingFilter);
  const pendingSearch = useFleetTableStore((s) => s.pendingSearch);
  const clearTableFilter = useFleetTableStore((s) => s.clearTableFilter);

  useEffect(() => {
    if (!pendingTab && !pendingFilter && pendingSearch === null) return;
    if (pendingTab) setTab(pendingTab);
    if (pendingFilter) setVtsFilter(pendingFilter);
    if (pendingSearch !== null) setSearch(pendingSearch);
    setPage(1);
    clearTableFilter();
  }, [pendingTab, pendingFilter, pendingSearch, clearTableFilter]);

  // Row click → open drawer locally
  const handleVehicleClick = (row) => {
    if (!row?.imei || row.imei === "N/A") return;
    setLocalDrawerVehicle(row);
  };

  const handleImeiClick = (imei, accid) => {
    if (!imei || imei === "N/A") return;
    navigate("/tracking", {
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

  // ── Export ──────────────────────────────────────────────────────────────────
  const VTS_COLS = [
    { key: "no", label: "No", width: 6 },
    { key: "accountName", label: "Account", width: 22 },
    { key: "vehnum", label: "Vehicle No.", width: 16 },
    { key: "imei", label: "IMEI", width: 20 },
    { key: "power", label: "Power", width: 14 },
    { key: "dateTime", label: "Date/Time", width: 22 },
    { key: "address", label: "Address", width: 36 },
    { key: "lat", label: "Lat", width: 14 },
    { key: "lng", label: "Lng", width: 14 },
    { key: "gps", label: "GPS", width: 10 },
    { key: "ignition", label: "Ignition", width: 10 },
    { key: "speed", label: "Speed (km/h)", width: 14 },
    { key: "status", label: "Status", width: 12 },
  ];

  const UNREACHABLE_COLS = [
    { key: "no", label: "No", width: 6 },
    { key: "accountName", label: "Account", width: 22 },
    { key: "accid", label: "Acc ID", width: 10 },
    { key: "vehnum", label: "Vehicle No.", width: 16 },
    { key: "imei", label: "IMEI", width: 20 },
    { key: "deviceType", label: "Device Type", width: 14 },
    { key: "createdOn", label: "Created On", width: 22 },
  ];

  const vtsExportRows = useMemo(
    () =>
      filteredVts.map((r, i) => ({
        no: i + 1,
        accountName: r.accountName ?? "—",
        vehnum: r.vehnum || r.name || "—",
        imei: r.imei ?? "—",
        power: r.powsts === "Y" ? "Connected" : "Disconnected",
        dateTime: r.devTs || r.cts || "—",
        address: r.address && r.address !== "NA" ? r.address : "—",
        lat: r.lat?.toFixed(5) ?? "—",
        lng: r.lng?.toFixed(5) ?? "—",
        gps: r.gps === "A" ? "Active" : "Inactive",
        ignition: r.ign === "Y" ? "On" : "Off",
        speed: `${Number(r.speed ?? 0).toFixed(1)} km/h`,
        status: STATUS_META[r._status]?.label ?? r._status ?? "—",
      })),
    [filteredVts],
  );

  const unreachableExportRows = useMemo(
    () =>
      filteredUnreachable.map((r, i) => ({
        no: i + 1,
        accountName: r.accountName ?? "—",
        accid: r.accid ?? "—",
        vehnum: r.vehnum || r.name || "—",
        imei: r.imei ?? "—",
        deviceType: r.deviceType ?? "—",
        createdOn: r.createdOn ? new Date(r.createdOn).toLocaleString() : "—",
      })),
    [filteredUnreachable],
  );

  const stamp = () => new Date().toISOString().slice(0, 10);

  const activeExportRows =
    tab === "vts" ? vtsExportRows : unreachableExportRows;
  const activeExportCols = tab === "vts" ? VTS_COLS : UNREACHABLE_COLS;
  const activeExportLabel =
    tab === "vts" ? "live_vehicles" : "unreachable_devices";
  const exportMetaTitle =
    tab === "vts" ? "Live Vehicles" : "Unreachable Devices";
  const exportMetaSub =
    tab === "vts"
      ? `${filteredVts.length} vehicles${vtsFilter !== "all" ? ` · ${vtsFilter}` : ""}${search ? ` · "${search}"` : ""}`
      : `${filteredUnreachable.length} devices${search ? ` · "${search}"` : ""}`;

  const handleExportCSV = () =>
    exportCSV(
      activeExportRows,
      `${activeExportLabel}_${stamp()}.csv`,
      activeExportCols,
    );
  const handleExportExcel = () =>
    exportExcel(
      activeExportRows,
      `${activeExportLabel}_${stamp()}.xlsx`,
      activeExportCols,
      exportMetaTitle,
    );
  const handleExportPDF = () =>
    exportPDF(
      activeExportRows,
      `${activeExportLabel}_${stamp()}`,
      activeExportCols,
      { title: exportMetaTitle, subtitle: exportMetaSub },
    );

  const TABS = [
    { value: "vts", label: `Live Vehicles (${vtsCounts.all})` },
    { value: "unreachable", label: `Unreachable (${unreachableData.length})` },
  ];

  return (
    <Card className="mt-5" id="fleet-table-card">
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
          <ExportMenu
            disabled={activeExportRows.length === 0}
            onCSV={handleExportCSV}
            onExcel={handleExportExcel}
            onPDF={handleExportPDF}
          />
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
            onAccountClick={openAccountPopup}
            onRowClick={handleVehicleClick}
          />
        ) : (
          <UnreachableTable
            rows={pagedRows}
            loading={loadingUnreachable}
            onImeiClick={handleImeiClick}
            onAccountClick={openAccountPopup}
          />
        )}
      </div>

      {/* Vehicle detail drawer */}
      {drawerVehicle && (
        <VehicleDrawer vehicle={drawerVehicle} onClose={closeDrawer} />
      )}

      {/* Account status popup */}
      {popup && (
        <AccountPopup
          name={popup.name}
          data={popup.data}
          loading={popup.loading}
          error={popup.error}
          anchorRef={popup.anchorRef}
          onClose={closeAccountPopup}
        />
      )}

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
