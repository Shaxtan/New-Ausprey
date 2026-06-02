import { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils';

export const Input = forwardRef(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'ring-focus w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder-slate-400 transition',
        className
      )}
      {...rest}
    />
  );
});

export function SearchInput({ value, onChange, placeholder = 'Search...', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <Input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

export default Input;
