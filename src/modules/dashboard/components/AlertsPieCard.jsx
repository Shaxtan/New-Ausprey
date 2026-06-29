/**
 * AlertsPieCard.jsx — New-Ausprey Dashboard
 *
 * Displays alert counts by type as an interactive donut chart.
 * Clicking a slice (or the whole chart) opens a modal listing the
 * individual alerts, filtered to the clicked type.
 *
 * Data comes from POST /usage/alerts/db-alerts:
 *   { summary: [{ type, count }], data: [{ ...alert }] }
 */
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { AlertTriangle } from "lucide-react";
import { Card, CardHeader, Skeleton } from "@/components/ui";
import { ChartContainer, chartTooltipProps } from "@/components/charts";
import { formatNumber } from "@/utils";
import { cn } from "@/utils";
import { AlertsModal, ALERT_META, typeLabel, typeColor } from "./AlertsModal";

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

export function AlertsPieCard({ summary = [], alerts = [], loading }) {
  const [modalType, setModalType] = useState(null); // null = closed; 'ALL' or a type code

  const chartData = useMemo(
    () =>
      summary.map((s, i) => ({
        type: s.type,
        name: typeLabel(s.type),
        value: s.count,
        color: typeColor(s.type, i),
      })),
    [summary],
  );

  const total = useMemo(
    () => summary.reduce((sum, s) => sum + (s.count || 0), 0),
    [summary],
  );

  return (
    <Card hover>
      <CardHeader
        title="Alerts"
        subtitle={total ? `${formatNumber(total)} total` : undefined}
      />

      {loading ? (
        <Skeleton className="h-44 w-44 rounded-full mx-auto" />
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <AlertTriangle size={28} className="mb-2 text-slate-300" />
          <p className="text-sm">No alerts</p>
        </div>
      ) : (
        <>
          <div
            className="cursor-pointer"
            onClick={() => setModalType("ALL")}
            title="Click to view all alerts"
          >
            <ChartContainer height={170}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius="62%"
                  outerRadius="100%"
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  onClick={(slice) =>
                    slice?.payload?.type && setModalType(slice.payload.type)
                  }
                >
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.color} className="cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipProps} />
                <text
                  x="50%"
                  y="47%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: 24, fontWeight: 800, fill: "#0f172a" }}
                >
                  {formatNumber(total)}
                </text>
                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                >
                  Alerts
                </text>
              </PieChart>
            </ChartContainer>
          </div>

          {/* Legend — clickable rows */}
          <div className="mt-4 space-y-2">
            {chartData.map((v) => (
              <button
                key={v.type}
                onClick={() => setModalType(v.type)}
                className="w-full flex items-center justify-between text-sm group"
              >
                <span className="flex items-center gap-2 text-slate-600 font-medium group-hover:text-primary transition">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: v.color }}
                  />
                  {v.name}
                </span>
                <span className="font-bold text-slate-800">
                  {formatNumber(v.value)}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-slate-400 text-center">
            Click a slice or type to view alerts
          </p>
        </>
      )}

      {modalType && (
        <AlertsModal
          type={modalType}
          alerts={alerts}
          onClose={() => setModalType(null)}
        />
      )}
    </Card>
  );
}

export default AlertsPieCard;
