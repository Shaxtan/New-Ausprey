import { Skeleton } from '@/components/ui';
import { cn } from '@/utils';

// columns: [{ key, header, render?(row), className?, cellClassName?, hide?: 'md'|'lg' }]
export function DataTable({
  columns, data = [], loading = false, rowKey = 'id',
  emptyText = 'No records found.', skeletonRows = 5, onRowClick,
}) {
  const hideClass = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-slate-400 border-y border-slate-100 bg-slate-50">
            {columns.map((c) => (
              <th key={c.key} className={cn('px-5 py-2.5', c.hide && hideClass[c.hide], c.className)}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td colSpan={columns.length} className="px-5 py-3.5"><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))
            : data.length === 0
            ? <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-400">{emptyText}</td></tr>
            : data.map((row, ri) => (
                <tr
                  key={row[rowKey] ?? ri}
                  onClick={() => onRowClick?.(row)}
                  className={cn('border-b border-slate-50 transition hover:bg-slate-50 group', onRowClick && 'cursor-pointer')}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-5 py-3.5 text-slate-600', c.hide && hideClass[c.hide], c.cellClassName)}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
