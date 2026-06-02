import { Card, CardHeader, StatusBadge } from '@/components/ui';
import { DataTable, Pagination } from '@/components/tables';
import { formatRelative } from '@/utils';

function Meter({ value, danger }) {
  const color = value === 0 ? '#94a3b8' : value < 25 ? '#ef4444' : danger ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-slate-500">{value}%</span>
    </div>
  );
}

export function DevicesTable({ data, loading, total, toolbar }) {
  const columns = [
    { key: 'id', header: 'Device ID', render: (r) => <span className="font-bold text-slate-800">{r.id}</span> },
    { key: 'type', header: 'Type', hide: 'md' },
    { key: 'vehicle', header: 'Vehicle', render: (r) => <span className="font-medium text-slate-700">{r.vehicle}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'battery', header: 'Battery', hide: 'md', render: (r) => <Meter value={r.battery} /> },
    { key: 'signal', header: 'Signal', hide: 'lg', render: (r) => <Meter value={r.signal} danger /> },
    { key: 'firmware', header: 'Firmware', hide: 'lg', render: (r) => <span className="text-xs font-mono text-slate-500">{r.firmware}</span> },
    { key: 'lastSeen', header: 'Last Seen', hide: 'lg', render: (r) => formatRelative(r.lastSeen) },
  ];
  return (
    <Card padded={false}>
      <div className="p-5 pb-3"><CardHeader title="IoT Sensors" />{toolbar}</div>
      <DataTable columns={columns} data={data} loading={loading} rowKey="id" />
      <Pagination page={1} pageCount={Math.ceil((total || 1) / 7)} summary={`Showing ${data?.length ?? 0} of ${total} devices`} />
    </Card>
  );
}

export default DevicesTable;
