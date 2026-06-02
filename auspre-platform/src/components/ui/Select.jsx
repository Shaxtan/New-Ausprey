import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils';

export function Select({ label, options = [], value, onChange, className }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'ring-focus appearance-none w-full pl-3 pr-9 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 transition cursor-pointer'
          )}
        >
          {options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default Select;
