import { MoreVertical } from 'lucide-react';
import { Card, StatusBadge } from '@/components/ui';
import { DataTable, Pagination } from '@/components/tables';
import { formatNumber, formatRelative } from '@/utils';

export function VehiclesTable({ data, loading, total, toolbar }) {
  const columns = [
    { key: 'reg', header: 'Vehicle', render: (r) => (
      <div className="leading-tight"><div className="font-bold text-slate-800">{r.reg}</div><div className="text-xs text-slate-400">{r.model}</div></div>
    ) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'driver', header: 'Driver', hide: 'md' },
    { key: 'location', header: 'Location', hide: 'lg' },
    { key: 'speed', header: 'Speed', render: (r) => <span className="font-semibold text-slate-700">{r.speed} km/h</span> },
    { key: 'odometer', header: 'Odometer', hide: 'lg', render: (r) => `${formatNumber(r.odometer)} km` },
    { key: 'fuel', header: 'Fuel', hide: 'md', render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${r.fuel}%`, backgroundColor: r.fuel < 25 ? '#ef4444' : '#10b981' }} />
        </div>
        <span className="text-xs font-semibold text-slate-500">{r.fuel}%</span>
      </div>
    ) },
    { key: 'lastUpdate', header: 'Last Update', hide: 'lg', render: (r) => formatRelative(r.lastUpdate) },
    { key: 'actions', header: '', render: () => <button className="text-slate-300 group-hover:text-slate-500 transition p-1"><MoreVertical size={16} /></button> },
  ];
  return (
    <Card padded={false}>
      {toolbar}
      <DataTable columns={columns} data={data} loading={loading} rowKey="id" />
      <Pagination page={1} pageCount={8} summary={`Showing ${data?.length ?? 0} of ${formatNumber(total)} vehicles`} />
    </Card>
  );
}

export default VehiclesTable;
