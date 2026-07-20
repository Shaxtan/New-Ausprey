import { Card, CardHeader, Skeleton } from '@/components/ui';
import { DonutChart } from '@/components/charts';

export function VehiclePerformanceCard({ data, loading, height = 340 }) {
  const vehicles = data?.vehicles ?? [];
  const total = data?.totalDistance ?? 0;

  return (
    <Card hover className="flex flex-col" style={{ height }}>
      <CardHeader title="Performance by Vehicle" subtitle="Distance share this week" />
      <div className="flex-1 min-h-0 mt-2 flex items-center">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="flex items-center gap-5 w-full">
            {/* Donut with a custom center overlay — fully controlled, so the
                label can never clip against the ring regardless of how long
                the text is or how DonutChart sizes its own internals. */}
            <div className="relative w-36 h-36 shrink-0">
              <DonutChart data={vehicles} height={144} />
              <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center pointer-events-none">
                <div className="text-lg font-black text-slate-800 leading-tight">
                  {total.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">
                  Total Distance (km)
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              {vehicles.map((v) => {
                const pct = total ? ((v.value / total) * 100).toFixed(1) : '0.0';
                return (
                  <div key={v.name} className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm mt-1 shrink-0" style={{ backgroundColor: v.color }} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-700 truncate">{v.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {v.value.toLocaleString('en-IN')} km ({pct}%)
                      </div>
                    </div>
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

export default VehiclePerformanceCard;