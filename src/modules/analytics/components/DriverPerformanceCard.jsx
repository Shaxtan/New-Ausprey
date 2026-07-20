import { Card, CardHeader, Skeleton, Avatar } from '@/components/ui';

export function DriverPerformanceCard({ data = [], loading, height = 300 }) {
  return (
    <Card hover className="flex flex-col" style={{ height }}>
      <CardHeader title="Driver Performance" subtitle="Top 5" />
      <div className="flex-1 min-h-0 mt-2 overflow-y-auto">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 px-0.5">
              <span>Driver</span>
              <span>Performance Score</span>
            </div>
            <div className="space-y-3">
              {data.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <Avatar name={d.name} size="sm" />
                  <span className="text-xs font-semibold text-slate-700 w-24 shrink-0 truncate">{d.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${d.score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 w-7 text-right shrink-0">{d.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default DriverPerformanceCard;