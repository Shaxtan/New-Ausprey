/**
 * ResponseStatusCard.jsx — Alert Dashboard
 *
 * Horizontal bar breakdown of Open / Acknowledged / Resolved counts,
 * driven by useAlertTriage's LOCAL (browser-only) triage state — see that
 * hook's header comment for why this isn't server-synced.
 */
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { formatNumber } from "@/utils";

export const STATUS_META = {
  open: { label: "Open", color: "#ef4444" },
  acknowledged: { label: "Acknowledged", color: "#2563eb" },
  resolved: { label: "Resolved", color: "#10b981" },
};
export const STATUS_ORDER = ["open", "acknowledged", "resolved"];
const ORDER = STATUS_ORDER;

export function ResponseStatusCard({ alerts = [], getStatus, loading }) {
  const total = alerts.length;
  const counts = alerts.reduce(
    (acc, a) => {
      const s = getStatus(a.id);
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    { open: 0, acknowledged: 0, resolved: 0 },
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-6 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4 text-[11px] text-slate-400">
        <Info size={12} />
        Tracked locally in this browser — not synced to a server.
      </div>
      <div className="space-y-3.5">
        {ORDER.map((key) => {
          const meta = STATUS_META[key];
          const count = counts[key] ?? 0;
          const pct = total ? (count / total) * 100 : 0;
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="font-medium text-slate-600">{meta.label}</span>
                <span className="font-bold text-slate-800">
                  {formatNumber(count)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    ({pct.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: meta.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResponseStatusCard;
