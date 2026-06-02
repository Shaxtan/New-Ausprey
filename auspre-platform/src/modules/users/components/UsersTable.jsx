import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, Avatar, RoleBadge, StatusBadge } from '@/components/ui';
import { DataTable, Pagination } from '@/components/tables';
import { formatRelative } from '@/utils';

export function UsersTable({ data, loading, total, toolbar }) {
  const columns = [
    { key: 'name', header: 'User', render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar name={r.name} size={36} />
        <div className="leading-tight"><div className="font-bold text-slate-800">{r.name}</div><div className="text-xs text-slate-400">{r.email}</div></div>
      </div>
    ) },
    { key: 'role', header: 'Role', render: (r) => <RoleBadge role={r.role} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'dept', header: 'Department', hide: 'md' },
    { key: 'location', header: 'Location', hide: 'lg' },
    { key: 'lastLogin', header: 'Last Login', hide: 'lg', render: (r) => formatRelative(r.lastLogin) },
    { key: 'actions', header: '', render: () => (
      <div className="flex items-center gap-1 text-slate-300">
        <button className="p-1 rounded hover:bg-slate-100 hover:text-slate-600 transition"><Pencil size={15} /></button>
        <button className="p-1 rounded hover:bg-rose-50 hover:text-rose-500 transition"><Trash2 size={15} /></button>
        <button className="p-1 rounded hover:bg-slate-100 hover:text-slate-600 transition"><MoreVertical size={15} /></button>
      </div>
    ) },
  ];
  return (
    <Card padded={false}>
      <div className="p-5 pb-3"><CardHeader title="All Users" />{toolbar}</div>
      <DataTable columns={columns} data={data} loading={loading} rowKey="id" />
      <Pagination page={1} pageCount={52} summary={`Showing 1 to ${data?.length ?? 0} of ${total} users`} />
    </Card>
  );
}

export default UsersTable;
