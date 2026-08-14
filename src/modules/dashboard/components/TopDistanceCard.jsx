/**
 * TopDistanceCard.jsx — Dashboard
 *
 * Shows the top N vehicles ranked by distance today, as a horizontal bar
 * chart only (no ranked list below it). Sourced from the dedicated
 * /reports/top-distance-devices endpoint (per-vehicle, server-ranked).
 *
 * Clicking a bar opens the Distance Report (inside the Reports hub) with
 * that vehicle's IMEI pre-filled and the report auto-fetched — the same
 * `activeReport` navigation pattern the Fleet Chat Assistant's OPEN_REPORT
 * action already uses to reach DistanceReportPage, and the same behaviour
 * the old ranked-list rows used to trigger.
 */

import { Route } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "@/components/ui";
import { BarChart } from "@/components/charts";
import { PATHS } from "@/constants";
import { formatNumber } from "@/utils";

// Interpolates from the app's primary blue (rank 1) down to a pale tint
// (last rank), scaling smoothly across however many bars are actually
// shown — unlike a fixed palette, this never wraps/resets partway through.
const SHADE_START = { r: 0x1a, g: 0x73, b: 0xe8 }; // #1A73E8
const SHADE_END = { r: 0xdb, g: 0xea, b: 0xfe }; // pale blue
function shadeForRank(i, total) {
  const t = total > 1 ? i / (total - 1) : 0;
  const r = Math.round(SHADE_START.r + (SHADE_END.r - SHADE_START.r) * t);
  const g = Math.round(SHADE_START.g + (SHADE_END.g - SHADE_START.g) * t);
  const b = Math.round(SHADE_START.b + (SHADE_END.b - SHADE_START.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function TopDistanceCard({ data = [], loading }) {
  const navigate = useNavigate();

  const chartData = data.map((d, i) => ({
    ...d,
    color: shadeForRank(i, data.length),
  }));

  const openDistanceReport = (d) => {
    if (!d?.imei) return;
    navigate(PATHS.REPORTS, {
      state: {
        activeReport: "distance",
        targetImei: d.imei,
        targetAccountId: d.accountId,
        targetVehicleLabel: d.name,
      },
    });
  };

  return (
    <Card hover className="min-h-[280px] flex flex-col">
      <CardHeader
        title="Top by Distance"
        subtitle="Today — by vehicle"
        action={
          <button
            onClick={() => navigate(PATHS.REPORTS)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Full Report
          </button>
        }
      />

      <div className="flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="space-y-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Route size={24} className="mb-2 text-slate-300" />
            <p className="text-xs text-center">
              No distance data for today yet.
            </p>
          </div>
        ) : (
          <BarChart
            data={chartData}
            dataKey="value"
            layout="vertical"
            height={Math.max(180, chartData.length * 34)}
            showValueLabels
            valueFormatter={(v) => `${formatNumber(v)} km`}
            onBarClick={openDistanceReport}
          />
        )}
      </div>
    </Card>
  );
}

export default TopDistanceCard;
