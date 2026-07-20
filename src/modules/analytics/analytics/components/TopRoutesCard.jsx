import { Card, CardHeader } from '@/components/ui';
import { DataTable } from '@/components/tables';
import { formatNumber } from '@/utils';

export function TopRoutesCard({ data = [], loading }) {
  const columns = [
    { key: 'route', header: 'Route', render: (r) => <span className="font-semibold text-slate-700">{r.route}</span> },
    { key: 'trips', header: 'Trips' },
    { key: 'distance', header: 'Distance', render: (r) => `${formatNumber(r.distance)} km` },
  ];
  return (
    <Card padded={false}>
      <div className="p-5 pb-3"><CardHeader title="Top Routes" /></div>
      <DataTable columns={columns} data={data} loading={loading} rowKey="id" />
    </Card>
  );
}

export default TopRoutesCard;
