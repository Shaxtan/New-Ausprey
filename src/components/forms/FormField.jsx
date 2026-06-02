import { cn } from '@/utils';

export function FormField({ label, hint, error, required, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-600">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-rose-500">{error}</p>
        : hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export default FormField;
