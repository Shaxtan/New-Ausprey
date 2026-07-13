/**
 * RecentAlertsListCard.jsx — Dashboard
 *
 * Compact "Recent Alerts" list matching the reference dashboard's alert
 * panel: icon + title + subtitle (vehicle) + right-aligned time, most
 * recent first. "View All" opens the full AlertsModal (already built).
 *
 * Data: same db-alerts feed as AlertsPieCard (summary + data).
 */
import { useState } from "react";
import { LogOut, BatteryLow, WifiOff, AlertTriangle, Bell } from "lucide-react";
import { Card, Skeleton } from "@/components/ui";
import { AlertsModal, typeLabel } from "./AlertsModal";

// Icon + colour per alert type, matching the reference's icon style
const TYPE_ICON = {
  OVS: { icon: AlertTriangle, bg: "#fee2e2", color: "#dc2626" }, // Overspeed
  GEO: { icon: LogOut, bg: "#fef3c7", color: "#d97706" }, // Geofence exit
  BAT: { icon: BatteryLow, bg: "#fef3c7", color: "#d97706" }, // Low battery
  HAR: { icon: AlertTriangle, bg: "#fee2e2", color: "#dc2626" },
  HBR: { icon: AlertTriangle, bg: "#fee2e2", color: "#dc2626" },
  SOS: { icon: AlertTriangle, bg: "#fee2e2", color: "#dc2626" },
  IGN: { icon: WifiOff, bg: "#e0f2fe", color: "#0284c7" },
  TOW: { icon: WifiOff, bg: "#ede9fe", color: "#7c3aed" },
  IDL: { icon: WifiOff, bg: "#ffedd5", color: "#ea580c" },
};
const DEFAULT_ICON = { icon: Bell, bg: "#f1f5f9", color: "#64748b" };

const fmtTime = (s) => {
  if (!s) return "—";
  const d = new Date(s.replace?.(" ", "T") ?? s);
  if (isNaN(d)) return s;
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function alertSubtitle(a) {
  if (a.type === "OVS")
    return `Truck ${a.vehicleNumber ?? a.imei} exceeded ${a.speed ?? "—"} km/h`;
  if (a.type === "GEO") return `Truck ${a.vehicleNumber ?? a.imei} exited zone`;
  if (a.type === "BAT")
    return `Device ${a.imei} battery at ${a.battery ?? "—"}V`;
  return a.message || a.address || `${typeLabel(a.type)} alert`;
}

export function RecentAlertsListCard({ alerts = [], loading }) {
  const [showAll, setShowAll] = useState(false);
  const recent = [...alerts]
    .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
    .slice(0, 5);

  return (
    <Card hover>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Recent Alerts</h3>
        <button
          onClick={() => setShowAll(true)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          View All
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <Bell size={24} className="mb-2 text-slate-300" />
          <p className="text-xs">No recent alerts.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {recent.map((a, i) => {
            const meta = TYPE_ICON[a.type] ?? DEFAULT_ICON;
            const Icon = meta.icon;
            return (
              <div
                key={a.id ?? i}
                className="flex items-start gap-3 py-2.5 px-1 -mx-1 rounded-xl hover:bg-slate-50 transition"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: meta.bg }}
                >
                  <Icon size={15} style={{ color: meta.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800">
                    {typeLabel(a.type)}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {alertSubtitle(a)}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-medium shrink-0 whitespace-nowrap">
                  {fmtTime(a.createdOn)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAll && (
        <AlertsModal
          type="ALL"
          alerts={alerts}
          onClose={() => setShowAll(false)}
        />
      )}
    </Card>
  );
}

export default RecentAlertsListCard;
