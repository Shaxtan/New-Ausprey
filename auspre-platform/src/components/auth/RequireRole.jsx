import { useAuthStore } from '@/store';

/**
 * Restricts children to users whose role matches one of `roles`.
 *
 * ASSUMPTION (please confirm against your real auth store): reads the
 * logged-in user via `useAuthStore((s) => s.user)` and expects
 * `user.role` to be a string matching a key in ROLE_BADGE, e.g.
 * 'Super Admin'. If your store shapes this differently, only the
 * `useAuthStore((s) => s.user?.role)` line below needs to change.
 */
export function RequireRole({ roles, children, fallback = null }) {
  const role = useAuthStore((s) => s.user?.role);
  return roles.includes(role) ? children : fallback;
}

export default RequireRole;