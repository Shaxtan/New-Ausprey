import { TrendingUp, TrendingDown } from 'lucide-react';
import { tokens } from '@/themes';

export function Trend({ value, direction = 'up', suffix = 'vs last month', neutral = false }) {
  if (neutral) return <span className="text-xs font-medium text-slate-400">{value}</span>;
  const up = direction === 'up';
  const Icon = up ? TrendingUp : TrendingDown;
  const color = up ? tokens.status.success : tokens.status.danger;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color }}>
      <Icon size={13} strokeWidth={2.6} />
      {value}
      {suffix && <span className="ml-0.5 font-medium text-slate-400">{suffix}</span>}
    </span>
  );
}

export default Trend;
