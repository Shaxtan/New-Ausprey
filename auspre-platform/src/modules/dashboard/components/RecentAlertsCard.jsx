import { Card, CardHeader } from '@/components/ui';
import { DataTable } from '@/components/tables';
import { formatDateTime } from '@/utils';

export function RecentAlertsCard({ data = [], loading }) {
  const columns = [
    { key: 'type', header: 'Alert Type', render: (r) => <span className="font-semibold" style={{ color: r.color }}>{r.type}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (r) => <span className="font-medium text-slate-700">{r.vehicle}</span> },
    { key: 'time', header: 'Time', render: (r) => formatDateTime(r.time), hide: 'md' },
    { key: 'location', header: 'Location', render: (r) => r.location },
  ];
  return (
    <Card hover padded={false}>
      <div className="p-5 pb-3">
        <CardHeader title="Recent Alerts" action={<button className="text-xs font-semibold text-primary hover:underline">View All</button>} />
      </div>
      <DataTable columns={columns} data={data} loading={loading} rowKey="id" />
    </Card>
  );
}

export default RecentAlertsCard;
