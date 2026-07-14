/**
 * AlertCategoriesChart.jsx — Alert Dashboard
 *
 * Bar chart of alert counts by type (BAT, HAR, OVS, ...), sorted
 * descending, matching the reference dashboard's "Alert Categories" panel.
 */
import { BarChart } from "@/components/charts";
import { Skeleton } from "@/components/ui";
import { classifyAlert, SEVERITY_META } from "../utils/alertSeverity";
import {
  typeLabel,
  typeColor,
} from "@/modules/dashboard/components/AlertsModal";

export function AlertCategoriesChart({ alerts = [], loading }) {
  const counts = {};
  const colorByLabel = {};

  for (const a of alerts) {
    const { severity, label } = classifyAlert(a, typeLabel(a.type));
    counts[label] = (counts[label] ?? 0) + 1;
    // Colour by derived severity when message-based (Harsh Braking/Acceleration),
    // otherwise fall back to the standard per-type colour.
    colorByLabel[label] =
      label === "Harsh Braking" || label === "Harsh Acceleration"
        ? SEVERITY_META[severity].color
        : typeColor(a.type);
  }

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      name: label,
      value,
      color: colorByLabel[label],
    }));

  if (loading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-400">
        No alert categories to show.
      </div>
    );
  }

  return <BarChart data={data} dataKey="value" height={230} />;
}

export default AlertCategoriesChart;
