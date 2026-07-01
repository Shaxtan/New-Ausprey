/**
 * TopDistanceCard.jsx — Dashboard
 *
 * Shows the top N sub-accounts ranked by total distance today,
 * as a horizontal bar chart with a ranked list below showing
 * exact km values and device counts.
 */

import { Route } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "@/components/ui";
import { BarChart } from "@/components/charts";
import { PATHS } from "@/constants";
import { formatNumber } from "@/utils";

// Progressively lighter blues per rank
const BAR_COLORS = [
  "#1A73E8",
  "#2e7eed",
  "#4a8ff2",
  "#6aa4f5",
  "#8bb9f8",
];

export function TopDistanceCard({ data = [], loading }) {
  const navigate = useNavigate();

  const chartData = data.map((d, i) => ({
    ...d,
    color: BAR_COLORS[i] ?? "#8bb9f8",
  }));

  return (
    <Card
      hover
      className="h-[390px] flex flex-col"
    >
      <CardHeader
        title="Top by Distance"
        subtitle="Today — by sub-account"
        action={
          <button
            onClick={() => navigate(PATHS.REPORTS)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Full Report
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-7 w-full rounded-lg"
              />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Route
              size={24}
              className="mb-2 text-slate-300"
            />
            <p className="text-xs text-center">
              No distance data for today yet.
            </p>
          </div>
        ) : (
          <>
            {/* Horizontal Bar Chart */}
            <BarChart
              data={chartData}
              dataKey="value"
              layout="vertical"
              height={Math.max(120, chartData.length * 32)}
            />

            {/* Ranked List */}
            <div className="mt-2 space-y-0.5">
              {data.map((d, i) => (
                <div
                  key={d.accountId ?? i}
                  className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-5 h-5 rounded-md text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                      style={{
                        background: BAR_COLORS[i] ?? "#8bb9f8",
                      }}
                    >
                      {i + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate">
                        {d.name}
                      </div>

                      <div className="text-[10px] text-slate-400">
                        {d.devices} device
                        {d.devices !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </span>

                  <span className="text-xs font-bold text-slate-800 shrink-0 ml-2">
                    {formatNumber(d.value)}
                    <span className="ml-1 text-[10px] font-normal text-slate-400">
                      km
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

export default TopDistanceCard;