import { Card, CardHeader, Skeleton } from '@/components/ui';

export function TopSpeedingCard({ data = [], loading }) {
  return (
    <Card hover>
      <CardHeader title="Top Speeding" action={<button className="text-xs font-semibold text-primary hover:underline">View All</button>} />
      <div className="space-y-1">
        {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full mb-1.5" />)
          : data.map((t, i) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">{i + 1}</span>{t.vehicle}
              </span>
              <span className="text-sm font-bold" style={{ color: t.speed > 90 ? '#e11d48' : '#475569' }}>{t.speed} km/h</span>
            </div>
          ))}
      </div>
    </Card>
  );
}

export default TopSpeedingCard;
