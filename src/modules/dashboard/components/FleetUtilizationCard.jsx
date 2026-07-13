/**
 * FleetUtilizationCard.jsx — Dashboard
 *
 * 7-day trend line showing what % of fleet accounts moved (totalDistance > 0)
 * each day — a real, derivable proxy for "fleet utilization" from
 * getAccountSummaryReport, styled to match the reference dashboard's
 * "Fleet Utilization" widget (big % headline + trend badge + line chart).
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Gauge } from "lucide-react";
import { Card, CardHeader, Skeleton } from "@/components/ui";
import { cn } from "@/utils";

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

export function FleetUtilizationCard({
  points = [],
  avg = 0,
  trend = 0,
  loading,
}) {
  const isUp = trend >= 0;

  return (
    <Card hover>
      <CardHeader title="Fleet Utilization" subtitle="Last 7 days" />

      {loading ? (
        <div className="space-y-3 mt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : points.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <Gauge size={26} className="mb-2 text-slate-300" />
          <p className="text-xs text-center">No utilization data yet.</p>
        </div>
      ) : (
        <>
          {/* Headline */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 leading-none">
                {avg}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Average Utilization
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                isUp
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600",
              )}
            >
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isUp ? "+" : ""}
              {trend}%
            </div>
          </div>

          {/* Line chart */}
          <ResponsiveContainer width="100%" height={160}>
            <LineChart
              data={points}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [`${v}%`, "Utilization"]}
              />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke="#1A73E8"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#1A73E8", strokeWidth: 0 }}
                activeDot={{ r: 5.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  );
}

export default FleetUtilizationCard;
