import { Card, CardHeader, Skeleton } from '@/components/ui';
import { AreaChart } from '@/components/charts';
import { DataTable } from '@/components/tables';
import { formatNumber } from '@/utils';

export function ReportContent({ series = [], rows = [], loading }) {
  const columns = [
    { key: 'vehicle', header: 'Vehicle', render: (r) => <span className="font-bold text-slate-800">{r.vehicle}</span> },
    { key: 'distance', header: 'Distance', render: (r) => `${formatNumber(r.distance)} km` },
    { key: 'trips', header: 'Trips' },
    { key: 'fuel', header: 'Fuel (L)', hide: 'md' },
    { key: 'idle', header: 'Idle Time', hide: 'md' },
  ];
  return (
    <div className="space-y-4">
      <Card hover>
        <CardHeader title="Distance Trend" subtitle="Last 7 days" />
        {loading ? <Skeleton className="h-52 w-full" /> : <AreaChart data={series} color="#2563eb" height={220} />}
      </Card>
      <Card padded={false}>
        <div className="p-5 pb-3"><CardHeader title="Per-Vehicle Breakdown" /></div>
        <DataTable columns={columns} data={rows} loading={loading} rowKey="id" />
      </Card>
    </div>
  );
}

export default ReportContent;
