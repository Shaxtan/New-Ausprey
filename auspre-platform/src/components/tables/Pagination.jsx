import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

export function Pagination({ page = 1, pageCount = 1, onPageChange, summary }) {
  const windowSize = 5;
  const pages = [];
  for (let p = 1; p <= Math.min(windowSize, pageCount); p += 1) pages.push(p);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
      {summary && <span className="text-xs text-slate-400 font-medium">{summary}</span>}
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange?.(Math.max(1, page - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button key={p} onClick={() => onPageChange?.(p)}
            className={cn('w-8 h-8 text-sm font-semibold rounded-lg transition', p === page ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100')}>
            {p}
          </button>
        ))}
        {pageCount > windowSize && (
          <>
            <span className="px-1 text-slate-400">…</span>
            <button onClick={() => onPageChange?.(pageCount)} className="w-8 h-8 text-sm font-semibold rounded-lg text-slate-500 hover:bg-slate-100 transition">{pageCount}</button>
          </>
        )}
        <button onClick={() => onPageChange?.(Math.min(pageCount, page + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
