import { Card, CardHeader, Badge, Skeleton } from '@/components/ui';

export function RolePermissionsCard({ data = [], loading }) {
  return (
    <Card hover>
      <CardHeader title="Role Permissions Overview" action={<button className="text-xs font-semibold text-primary hover:underline">Manage</button>} />
      <div className="space-y-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          : data.map((r) => (
            <div key={r.role} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-800">{r.role}</span>
                <span className="text-xs text-slate-400 font-semibold">{r.members} members</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.permissions.map((p) => <Badge key={p} color="#1d4ed8" bg="#eff6ff">{p}</Badge>)}
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

export default RolePermissionsCard;
