import { cn } from '@/utils';

export function Tabs({ tabs = [], value, onChange, className }) {
  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-xl bg-slate-100 w-fit', className)}>
      {tabs.map((t) => {
        const tab = typeof t === 'string' ? { value: t, label: t } : t;
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              'px-3.5 py-1.5 text-sm font-semibold rounded-lg transition',
              active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
