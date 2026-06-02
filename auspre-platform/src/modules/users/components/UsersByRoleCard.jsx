import { Card, CardHeader, Skeleton } from '@/components/ui';
import { DonutChart } from '@/components/charts';
import { formatNumber } from '@/utils';

export function UsersByRoleCard({ data = [], loading }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <Card hover className="h-full">
      <CardHeader title="Users by Role" />
      {loading ? <Skeleton className="h-44 w-44 rounded-full mx-auto" />
        : <DonutChart data={data} centerValue={formatNumber(total)} centerLabel="Users" height={190} />}
      <div className="mt-4 space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600 font-medium"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />{d.name}</span>
            <span className="font-bold text-slate-800">{formatNumber(d.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default UsersByRoleCard;
