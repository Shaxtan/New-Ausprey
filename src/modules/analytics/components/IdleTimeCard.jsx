import { Card, CardHeader, Skeleton } from '@/components/ui';
import { DonutChart } from '@/components/charts';
import { Trend } from '@/components/common';

export function IdleTimeCard({ data, loading, height = 300 }) {
  const segments = data?.segments ?? [];
  const total = segments.reduce((s, d) => s + d.value, 0);

  return (
    <Card hover className="flex flex-col" style={{ height }}>
      <CardHeader title="Idle Time Analysis" />
      <div className="flex-1 min-h-0 mt-2 flex flex-col justify-center">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="mb-4">
              <div className="text-2xl font-black text-slate-800">{data?.totalIdleHours ?? 0} hr</div>
              {/* A reduction in idle time is the good outcome — direction is
                  inverted so a negative trend still renders green/"up". */}
              <Trend
                value={`${Math.abs(data?.trend ?? 0)}% vs last week`}
                direction={(data?.trend ?? 0) <= 0 ? 'up' : 'down'}
              />
            </div>
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 shrink-0">
                <DonutChart data={segments} height={96} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                {segments.map((s) => {
                  const pct = total ? ((s.value / total) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                      <span className="font-bold text-slate-800">{s.value} hr ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

export default IdleTimeCard;