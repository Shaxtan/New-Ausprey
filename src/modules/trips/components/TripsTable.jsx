import { useState } from 'react';
import { Card, StatusBadge } from '@/components/ui';
import { DataTable, Pagination } from '@/components/tables';
import { formatKm } from '@/utils';
const PAGE_SIZE = 6;
export function TripsTable({ data=[], loading, toolbar, onRowClick }) {
  const [page,setPage] = useState(1);
  const pageCount = Math.max(1,Math.ceil(data.length/PAGE_SIZE));
  const safePage  = Math.min(page,pageCount);
  const slice     = data.slice((safePage-1)*PAGE_SIZE, safePage*PAGE_SIZE);
  const columns = [
    { key:'id',       header:'Trip ID',          render:r=><span className="font-semibold text-primary">{r.id}</span> },
    { key:'vehicle',  header:'Vehicle / Driver',  render:r=><div className="leading-tight"><div className="font-semibold text-slate-700">{r.vehicle}</div><div className="text-xs text-slate-400">{r.driver}</div></div> },
    { key:'route',    header:'Route', hide:'lg',  render:r=><div className="text-xs leading-tight max-w-[230px]"><div className="text-slate-600 truncate">{r.source}</div><div className="text-slate-400 truncate">→ {r.destination}</div></div> },
    { key:'distance', header:'Distance', hide:'md', render:r=>formatKm(r.distance) },
    { key:'progress', header:'Progress', render:r=><div className="w-28"><div className="text-[11px] font-semibold text-slate-400 mb-1">{r.progress}%</div><div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{width:`${r.progress}%`,backgroundColor:r.status==='Delayed'?'#ef4444':'#2563eb'}}/></div></div> },
    { key:'status',   header:'Status', render:r=><StatusBadge status={r.status}/> },
  ];
  return (
    <Card padded={false} hover>
      {toolbar}
      <DataTable columns={columns} data={slice} loading={loading} rowKey="id" onRowClick={onRowClick} emptyText="No trips found."/>
      {!loading&&data.length>0&&<Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} summary={`Showing ${(safePage-1)*PAGE_SIZE+1} to ${Math.min(safePage*PAGE_SIZE,data.length)} of ${data.length} trips`}/>}
    </Card>
  );
}
export default TripsTable;