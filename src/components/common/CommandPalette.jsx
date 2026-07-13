/**
 * CommandPalette.jsx — New-Ausprey
 *
 * Global ⌘K / Ctrl+K command palette. Mounted once in DashboardLayout.
 *
 * Sections searched:
 *   1. Pages     — every entry in NAVIGATION (flattened, including grouped children)
 *   2. Reports   — every entry in REPORT_TYPES (jumps to Reports page pre-selected)
 *   3. Vehicles  — live fleet list, lazily fetched on first open
 *                  (getAllDevices — same call used by dashboard/chat/agents)
 *
 * Keyboard:
 *   Cmd+K / Ctrl+K  → toggle open
 *   Esc             → close
 *   ↑ / ↓           → move selection
 *   Enter           → activate selected item
 *
 * Selecting a vehicle navigates to Live Tracking with that IMEI pre-selected
 * (same `targetImei` state pattern used everywhere else in the app).
 * Selecting a report navigates to Reports with `activeReport` state
 * (same pattern the Fleet Chat Assistant's OPEN_REPORT action uses).
 */
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  FileBarChart,
  Truck,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Loader2,
  Command,
} from "lucide-react";
import { NAVIGATION } from "@/constants/navigation";
import { PATHS } from "@/constants/paths";
import { useAccountStore } from "@/store";
import { useCommandPaletteStore } from "@/store/useCommandPaletteStore";
import apiService from "@/services/apiService";
import { cn } from "@/utils";

// Reports mirrored from ReportsPage.jsx (kept here to avoid a circular import —
// ReportsPage renders inline components that aren't safe to import standalone)
const REPORT_TYPES = [
  {
    id: "distance",
    name: "Distance Report",
    desc: "Daily distance per vehicle",
  },
  {
    id: "hourly",
    name: "Working Hour Report",
    desc: "Session trips & account analytics",
  },
  { id: "trackplay", name: "Track Play", desc: "Historical route playback" },
  { id: "speed", name: "Overspeed Report", desc: "Violations by vehicle" },
  { id: "stoppage", name: "Stoppage Report", desc: "Stop duration & location" },
  {
    id: "fuel-theft",
    name: "Fuel Theft Report",
    desc: "Detect sudden analog sensor drops",
  },
  {
    id: "load-cell",
    name: "Load Cell Report",
    desc: "Sensor load data & averages",
  },
  {
    id: "live-load",
    name: "Live Load Graph",
    desc: "Real-time load monitoring",
  },
];

const STATUS_DOT = {
  running: "bg-emerald-500",
  idle: "bg-amber-400",
  stopped: "bg-rose-500",
  inactive: "bg-slate-300",
};

// ─── Flatten NAVIGATION (handles the "Administration" group's children) ──────
function flattenNav() {
  const out = [];
  for (const item of NAVIGATION) {
    if (item.divider) continue;
    if (item.group && item.children) {
      out.push(...item.children.map((c) => ({ ...c, group: item.label })));
    } else if (item.to) {
      out.push(item);
    }
  }
  return out;
}
const PAGE_ITEMS = flattenNav();

// ─── Fuzzy-ish match: all query chars must appear, in order, case-insensitive ─
function fuzzyMatch(query, text) {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = (text ?? "").toLowerCase();
  if (t.includes(q)) return true; // fast path: plain substring
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const accid = useAccountStore((s) => s.selectedAccount?.id ?? 1);
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const toggle = useCommandPaletteStore((s) => s.toggle);

  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesFetched, setVehiclesFetched] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // ── Global keyboard listener: Cmd+K / Ctrl+K to toggle, Esc to close ────────
  useEffect(() => {
    const handler = (e) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, toggle, setOpen]);

  // ── Focus input + reset state on open ───────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      // Lazily fetch vehicles on first open (or account switch) — reuses the
      // exact same call the dashboard/chat/agents already use.
      if (!vehiclesFetched) {
        setVehiclesLoading(true);
        apiService
          .getAllDevices(accid)
          .then((list) => {
            setVehicles(list ?? []);
            setVehiclesFetched(true);
          })
          .catch(() => setVehicles([]))
          .finally(() => setVehiclesLoading(false));
      }
    }
  }, [open, accid, vehiclesFetched]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── Build filtered result groups ────────────────────────────────────────────
  const groups = useMemo(() => {
    const term = query.trim();

    const pages = PAGE_ITEMS.filter(
      (p) => fuzzyMatch(term, p.label) || fuzzyMatch(term, p.group),
    ).map((p) => ({
      kind: "page",
      key: `page-${p.id}`,
      icon: p.icon ?? LayoutDashboard,
      title: p.label,
      sub: p.group ? `${p.group} · Page` : "Page",
      action: () => navigate(p.to),
    }));

    const reports = REPORT_TYPES.filter(
      (r) => fuzzyMatch(term, r.name) || fuzzyMatch(term, r.desc),
    ).map((r) => ({
      kind: "report",
      key: `report-${r.id}`,
      icon: FileBarChart,
      title: r.name,
      sub: r.desc,
      action: () => navigate(PATHS.REPORTS, { state: { activeReport: r.id } }),
    }));

    const vehicleMatches = term
      ? vehicles
          .filter(
            (v) =>
              fuzzyMatch(term, v.name) ||
              fuzzyMatch(term, v.id) ||
              fuzzyMatch(term, v.accountName),
          )
          .slice(0, 8)
      : vehicles.slice(0, 5); // show a handful by default so the section isn't empty

    const vehicleItems = vehicleMatches.map((v) => ({
      kind: "vehicle",
      key: `vehicle-${v.id}`,
      icon: Truck,
      title: v.name || v.id,
      sub: `${v.status ?? "Unknown"}${v.accountName ? ` · ${v.accountName}` : ""} · ${v.id}`,
      statusDot: STATUS_DOT[(v.status ?? "").toLowerCase()] ?? "bg-slate-300",
      action: () =>
        navigate(PATHS.TRACKING, {
          state: { targetImei: v.id, targetAccountId: v.accountId },
        }),
    }));

    return [
      { label: "Pages", items: pages },
      { label: "Reports", items: reports },
      { label: "Vehicles", items: vehicleItems },
    ].filter((g) => g.items.length > 0);
  }, [query, vehicles, navigate]);

  // Flat list for keyboard navigation (spans across groups)
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Clamp activeIdx when results change
  useEffect(() => {
    if (activeIdx >= flatItems.length)
      setActiveIdx(Math.max(0, flatItems.length - 1));
  }, [flatItems.length, activeIdx]);

  const activate = useCallback((item) => {
    if (!item) return;
    item.action();
    setOpen(false);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(flatItems[activeIdx]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  let runningIdx = -1; // tracks position across groups for keyboard highlight

  return createPortal(
    <div
      className="fixed inset-0 z-[9995] flex items-start justify-center pt-[12vh] px-4 bg-black/40"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search size={17} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, reports, or vehicles…"
            className="flex-1 text-sm outline-none placeholder:text-slate-400 bg-transparent"
          />
          {vehiclesLoading && (
            <Loader2
              size={14}
              className="text-slate-300 animate-spin shrink-0"
            />
          )}
          <kbd
            className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold
                          text-slate-400 bg-slate-100 rounded border border-slate-200"
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {flatItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Search size={24} className="mb-2 text-slate-300" />
              <p className="text-sm">No matches for &quot;{query}&quot;</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-1 last:mb-0">
                <div className="px-4 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  runningIdx++;
                  const isActive = runningIdx === activeIdx;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      data-active={isActive}
                      onMouseEnter={() => setActiveIdx(runningIdx)}
                      onClick={() => activate(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition",
                        isActive ? "bg-primary/8" : "hover:bg-slate-50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative",
                          isActive ? "bg-primary/15" : "bg-slate-100",
                        )}
                      >
                        <Icon
                          size={15}
                          className={
                            isActive ? "text-primary" : "text-slate-500"
                          }
                        />
                        {item.statusDot && (
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
                              item.statusDot,
                            )}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "text-sm font-semibold truncate",
                            isActive ? "text-primary" : "text-slate-700",
                          )}
                        >
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.sub}
                        </div>
                      </div>
                      {isActive && (
                        <CornerDownLeft
                          size={13}
                          className="text-primary shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ArrowUp size={11} />
            <ArrowDown size={11} /> Navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft size={11} /> Select
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Command size={11} /> K to toggle
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default CommandPalette;
