import { Card, CardHeader, Badge, StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/tables';
import { formatDateTime } from '@/utils';

const SEVERITY = {
  Critical: { color: '#be123c', bg: '#fff1f2' },
  Warning: { color: '#b45309', bg: '#fffbeb' },
  Info: { color: '#0369a1', bg: '#f0f9ff' },
};

export function AlertsTable({ data, loading, toolbar }) {
  const columns = [
    { key: 'type', header: 'Alert Type', render: (r) => <span className="font-semibold" style={{ color: r.color }}>{r.type}</span> },
    { key: 'severity', header: 'Severity', render: (r) => <Badge color={SEVERITY[r.severity].color} bg={SEVERITY[r.severity].bg}>{r.severity}</Badge> },
    { key: 'vehicle', header: 'Vehicle', render: (r) => <span className="font-medium text-slate-700">{r.vehicle}</span> },
    { key: 'driver', header: 'Driver', hide: 'md' },
    { key: 'time', header: 'Time', hide: 'lg', render: (r) => formatDateTime(r.time) },
    { key: 'location', header: 'Location', hide: 'md' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status === 'Resolved' ? 'Active' : 'Idle'} /> },
  ];
  return (
    <Card padded={false}>
      <div className="p-5 pb-3"><CardHeader title="Alerts" />{toolbar}</div>
      <DataTable columns={columns} data={data} loading={loading} rowKey="id" />
    </Card>
  );
}

export default AlertsTable;
