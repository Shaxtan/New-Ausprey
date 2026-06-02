import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

export const Card = forwardRef(function Card(
  { children, className, hover = false, padded = true, ...rest }, ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-card',
        hover && 'transition hover:-translate-y-[3px] hover:shadow-cardhover',
        padded && 'p-5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export const MotionCard = motion(Card);

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default Card;
