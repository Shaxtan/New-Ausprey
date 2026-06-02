import { cn } from '@/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-14', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary-soft">
          <Icon size={28} className="text-primary" strokeWidth={2} />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-800 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-md mb-5">{description}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
