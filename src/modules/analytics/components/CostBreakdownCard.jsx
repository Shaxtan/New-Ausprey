import { Card, CardHeader, Skeleton } from '@/components/ui';
import { DonutChart } from '@/components/charts';

const formatINR = (v) => `₹${Math.round(v ?? 0).toLocaleString('en-IN')}`;

export function CostBreakdownCard({ data, loading, height = 300 }) {
  const segments = data?.segments ?? [];
  const total = data?.totalCost ?? 0;

  return (
    <Card hover className="flex flex-col" style={{ height }}>
      <CardHeader title="Cost Breakdown" />
      <div className="flex-1 min-h-0 mt-2 flex items-center">
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="flex items-center gap-5 w-full">
            <div className="relative w-32 h-32 shrink-0">
              <DonutChart data={segments} height={128} />
              <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center pointer-events-none">
                <div className="text-base font-black text-slate-800 leading-tight">
                  {formatINR(total)}
                </div>
                <div className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">
                  Total Cost
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              {segments.map((s) => {
                const pct = total ? ((s.value / total) * 100).toFixed(1) : '0.0';
                return (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-bold text-slate-800 shrink-0 ml-2">
                      {formatINR(s.value)} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default CostBreakdownCard;