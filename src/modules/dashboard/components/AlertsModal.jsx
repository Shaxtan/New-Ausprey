/**
 * AlertsModal.jsx — reusable db-alerts list modal
 *
 * Extracted from AlertsPieCard so it can be opened from anywhere
 * (dashboard pie chart, Topbar bell, etc).
 *
 * Props:
 *   type    — 'ALL' or an alert type code (BAT, HAR…) to pre-filter
 *   alerts  — the db-alerts `data` array
 *   onClose — close handler
 */
import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, Search, MapPin, Clock } from "lucide-react";

// Friendly labels + colours for known alert types
export const ALERT_META = {
  BAT: { label: "Battery", color: "#f59e0b" },
  HAR: { label: "Harsh Accel.", color: "#ef4444" },
  HBR: { label: "Harsh Brake", color: "#e11d48" },
  OVS: { label: "Overspeed", color: "#8b5cf6" },
  GEO: { label: "Geofence", color: "#0ea5e9" },
  IGN: { label: "Ignition", color: "#10b981" },
  SOS: { label: "SOS / Panic", color: "#dc2626" },
  TOW: { label: "Tow", color: "#6366f1" },
  IDL: { label: "Idle", color: "#f97316" },
};

const PALETTE = [
  "#1A73E8",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#ec4899",
  "#6366f1",
  "#f97316",
];

export const typeLabel = (t) => ALERT_META[t]?.label ?? t;
export const typeColor = (t, i = 0) =>
  ALERT_META[t]?.color ?? PALETTE[i % PALETTE.length];

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export function AlertsModal({ type = "ALL", alerts = [], onClose }) {
  const [search, setSearch] = useState("");

  // Lock background scroll while the modal is open (prevents scroll-flicker)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const filtered = useMemo(() => {
    let list = type === "ALL" ? alerts : alerts.filter((a) => a.type === type);
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.vehicleNumber?.toLowerCase().includes(term) ||
          a.imei?.toLowerCase().includes(term) ||
          a.address?.toLowerCase().includes(term) ||
          a.message?.toLowerCase().includes(term),
      );
    }
    // Most recent first (by createdOn)
    return [...list].sort(
      (a, b) => new Date(b.createdOn) - new Date(a.createdOn),
    );
  }, [alerts, type, search]);

  const title = type === "ALL" ? "All Alerts" : `${typeLabel(type)} Alerts`;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary to-blue-800 text-white shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span className="text-base font-bold">{title}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 ml-1">
              {filtered.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vehicle, IMEI, address or message…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400">
              No alerts found.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left text-slate-400 font-semibold">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-slate-400 font-semibold">
                    Vehicle
                  </th>
                  <th className="px-4 py-2.5 text-left text-slate-400 font-semibold">
                    IMEI
                  </th>
                  <th className="px-4 py-2.5 text-left text-slate-400 font-semibold">
                    Address
                  </th>
                  <th className="px-4 py-2.5 text-left text-slate-400 font-semibold">
                    Message
                  </th>
                  <th className="px-4 py-2.5 text-center text-slate-400 font-semibold">
                    Speed
                  </th>
                  <th className="px-4 py-2.5 text-center text-slate-400 font-semibold">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          background: `${typeColor(a.type)}1a`,
                          color: typeColor(a.type),
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: typeColor(a.type) }}
                        />
                        {typeLabel(a.type)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-primary whitespace-nowrap">
                      {a.vehicleNumber || "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                      {a.imei}
                    </td>
                    <td
                      className="px-4 py-2.5 text-slate-600 max-w-[180px] truncate"
                      title={a.address}
                    >
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        {a.address || "—"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2.5 text-slate-500 max-w-[220px] truncate"
                      title={a.message || undefined}
                    >
                      {a.message ? (
                        <span className="text-[11px] italic">{a.message}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-600">
                      {a.speed ?? 0} km/h
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-500 whitespace-nowrap">
                      <span className="flex items-center justify-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        {fmtDate(a.createdOn)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AlertsModal;
