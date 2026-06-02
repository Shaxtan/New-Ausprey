import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

export function PageHeader({ crumbs = [], title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6', className)}>
      <div>
        {crumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
            {crumbs.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={13} />}
                <span className={i === crumbs.length - 1 ? 'text-primary font-semibold' : ''}>{c}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export default PageHeader;
