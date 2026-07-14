/**
 * AlertSeverityDonut.jsx — Alert Dashboard
 *
 * Donut chart of the derived severity distribution across the current
 * filtered alert set (see utils/alertSeverity.js for the type → severity
 * mapping used).
 */
import { DonutChart } from "@/components/charts";
import { Skeleton } from "@/components/ui";
import {
  classifyAlert,
  SEVERITY_META,
  SEVERITY_ORDER,
} from "../utils/alertSeverity";
import { typeLabel } from "@/modules/dashboard/components/AlertsModal";
import { formatNumber } from "@/utils";

export function AlertSeverityDonut({ alerts = [], loading }) {
  const counts = alerts.reduce((acc, a) => {
    const { severity } = classifyAlert(a, typeLabel(a.type));
    acc[severity] = (acc[severity] ?? 0) + 1;
    return acc;
  }, {});

  const total = alerts.length;
  const data = SEVERITY_ORDER.filter((s) => counts[s] > 0).map((s) => ({
    name: SEVERITY_META[s].label,
    value: counts[s],
    color: SEVERITY_META[s].color,
    key: s,
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center py-4">
        <Skeleton className="w-40 h-40 rounded-full mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-400">
        No alerts to summarise.
      </div>
    );
  }

  return (
    <div>
      <DonutChart
        data={data}
        centerValue={formatNumber(total)}
        centerLabel="Total"
        height={190}
      />
      <div className="mt-4 space-y-2">
        {SEVERITY_ORDER.filter((s) => counts[s] > 0).map((s) => {
          const meta = SEVERITY_META[s];
          const count = counts[s];
          const pct = total ? ((count / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={s} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: meta.color }}
                />
                {meta.label}
              </span>
              <span className="font-bold text-slate-800">
                {formatNumber(count)}{" "}
                <span className="text-xs font-normal text-slate-400">
                  ({pct}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AlertSeverityDonut;
