import { Card, CardHeader, Skeleton } from '@/components/ui';
import { DonutChart } from '@/components/charts';
import { formatNumber } from '@/utils';

export function VehicleStatusCard({ data = [], total, loading }) {
  return (
    <Card hover>
      <CardHeader title="Vehicles Status" />
      {loading ? <Skeleton className="h-44 w-44 rounded-full mx-auto" />
        : <DonutChart data={data} centerValue={formatNumber(total)} centerLabel="Total" height={170} />}
      <div className="mt-4 space-y-2">
        {data.map((v) => (
          <div key={v.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: v.color }} />{v.name}
            </span>
            <span className="font-bold text-slate-800">{formatNumber(v.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default VehicleStatusCard;
