import { cn } from '@/utils';

export function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div>
          {label && <div className="text-sm font-semibold text-slate-700">{label}</div>}
          {description && <div className="text-xs text-slate-400">{description}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition shrink-0', checked ? 'bg-primary' : 'bg-slate-200')}
      >
        <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', checked && 'translate-x-5')} />
      </button>
    </div>
  );
}

export default Toggle;
