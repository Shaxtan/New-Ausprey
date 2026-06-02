import { FileBarChart } from 'lucide-react';
import { Card, CardHeader, Skeleton } from '@/components/ui';
import { cn } from '@/utils';

export function ReportTypeList({ types = [], loading, activeId, onSelect }) {
  return (
    <Card padded={false} className="h-full">
      <div className="p-5 pb-3"><CardHeader title="Report Types" /></div>
      <div className="pb-2">
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-3"><Skeleton className="h-10 w-full" /></div>)
          : types.map((t) => (
            <button key={t.id} onClick={() => onSelect?.(t.id)}
              className={cn('w-full flex items-center gap-3 px-5 py-3 text-left transition border-l-2', activeId === t.id ? 'bg-blue-50/60 border-primary' : 'border-transparent hover:bg-slate-50')}>
              <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', activeId === t.id ? 'bg-blue-100' : 'bg-slate-100')}>
                <FileBarChart size={16} className={activeId === t.id ? 'text-primary' : 'text-slate-500'} />
              </span>
              <div className="leading-tight">
                <div className={cn('text-sm font-semibold', activeId === t.id ? 'text-primary' : 'text-slate-700')}>{t.name}</div>
                <div className="text-xs text-slate-400">{t.desc}</div>
              </div>
            </button>
          ))}
      </div>
    </Card>
  );
}

export default ReportTypeList;
