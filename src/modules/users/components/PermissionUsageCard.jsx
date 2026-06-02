import { Card, CardHeader, Skeleton } from '@/components/ui';

export function PermissionUsageCard({ data = [], loading }) {
  return (
    <Card hover>
      <CardHeader title="Permission Usage Summary" subtitle="% of users with access" />
      <div className="space-y-3.5">
        {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
          : data.map((p) => (
            <div key={p.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-600">{p.name}</span>
                <span className="text-sm font-bold text-slate-800">{p.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p.value}%`, backgroundColor: p.color }} />
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

export default PermissionUsageCard;
