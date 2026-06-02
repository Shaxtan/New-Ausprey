import { cn } from '@/utils';
import { ROLE_BADGE, STATUS_BADGE, DEFAULT_BADGE } from '@/constants';

export function Badge({ children, color = DEFAULT_BADGE.color, bg = DEFAULT_BADGE.bg, dot = false, className }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold', className)}
      style={{ color, backgroundColor: bg }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </span>
  );
}

export function RoleBadge({ role }) {
  const s = ROLE_BADGE[role] ?? DEFAULT_BADGE;
  return <Badge color={s.color} bg={s.bg}>{role}</Badge>;
}

export function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] ?? DEFAULT_BADGE;
  return <Badge dot color={s.color} bg={s.bg}>{status}</Badge>;
}

export default Badge;
