import { cn } from '@/utils';

const VARIANTS = {
  primary: 'bg-primary text-white shadow-sm hover:bg-primary-hover',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  danger: 'bg-rose-500 text-white shadow-sm hover:bg-rose-600',
  soft: 'bg-primary-soft text-primary hover:bg-blue-100',
};
const SIZES = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-3.5 py-2 gap-2',
  lg: 'text-sm px-5 py-2.5 gap-2',
};

export function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, className, children, ...rest }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg transition active:scale-[.97] select-none whitespace-nowrap focus:outline-none',
        VARIANTS[variant], SIZES[size], className
      )}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.2} />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 14 : 16} strokeWidth={2.2} />}
    </button>
  );
}

export default Button;
