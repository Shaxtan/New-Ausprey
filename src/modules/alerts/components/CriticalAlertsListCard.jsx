/**
 * CriticalAlertsListCard.jsx — Alert Dashboard
 *
 * Quick list of the most recent Critical/High severity alerts,
 * matching the reference dashboard's "Critical Alerts" panel.
 */
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { classifyAlert, SEVERITY_META } from "../utils/alertSeverity";
import { typeLabel } from "@/modules/dashboard/components/AlertsModal";

const relativeTime = (s) => {
  if (!s) return "—";
  const d = new Date((s ?? "").replace?.(" ", "T") ?? s);
  if (isNaN(d)) return s;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export function CriticalAlertsListCard({ alerts = [], loading, onViewAll }) {
  const top = [...alerts]
    .filter((a) =>
      ["critical", "high"].includes(
        classifyAlert(a, typeLabel(a.type)).severity,
      ),
    )
    .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Critical Alerts</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-primary hover:underline"
        >
          View All
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <AlertTriangle size={22} className="mb-2 text-slate-300" />
          <p className="text-xs">No critical or high-severity alerts.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {top.map((a, i) => {
            const { severity, label } = classifyAlert(a, typeLabel(a.type));
            const meta = SEVERITY_META[severity];
            return (
              <div
                key={a.id ?? i}
                className="flex items-center gap-3 py-2 px-1 -mx-1 rounded-lg hover:bg-slate-50 transition"
              >
                <AlertTriangle
                  size={15}
                  style={{ color: meta.color }}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800">
                    {label}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {a.vehicleNumber ?? a.imei}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                  {relativeTime(a.createdOn)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CriticalAlertsListCard;
