import { Card, CardHeader, Avatar, Skeleton } from '@/components/ui';
import { formatRelative } from '@/utils';

export function RecentActivitiesCard({ data = [], loading }) {
  return (
    <Card hover>
      <CardHeader title="Recent User Activities" action={<button className="text-xs font-semibold text-primary hover:underline">View All</button>} />
      <div className="space-y-1">
        {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-1" />)
          : data.map((a) => (
            <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <Avatar name={a.user} size={32} />
              <div className="flex-1 leading-snug">
                <p className="text-sm text-slate-700"><span className="font-bold text-slate-800">{a.user}</span> {a.action}</p>
                <span className="text-xs text-slate-400">{formatRelative(a.time)}</span>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

export default RecentActivitiesCard;
