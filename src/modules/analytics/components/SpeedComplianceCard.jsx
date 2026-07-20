import { Card, CardHeader, Skeleton } from '@/components/ui';
import { DonutChart } from '@/components/charts';

export function SpeedComplianceCard({ data, loading, height = 300 }) {
  const segments = data?.segments ?? [];

  return (
    <Card hover className="flex flex-col" style={{ height }}>
      <CardHeader title="Speed Compliance" />
      <div className="flex-1 min-h-0 mt-2 flex flex-col justify-center">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="mb-4">
              <div className="text-2xl font-black text-slate-800">{data?.compliantPct ?? 0}%</div>
              <div className="text-xs text-slate-400 font-medium">Compliant</div>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 shrink-0">
                <DonutChart data={segments} height={96} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                {segments.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      {s.value}%
                      <span className={s.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        ({s.trend >= 0 ? '↑' : '↓'}{Math.abs(s.trend)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

export default SpeedComplianceCard;