// Role + status visual mapping. Plain hex (not Tailwind) so it works for
// arbitrary values and stays the single source of badge colours app-wide.
export const ROLE_BADGE = {
  'Super Admin':   { color: '#1d4ed8', bg: '#eff6ff' },
  'Fleet Manager': { color: '#1d4ed8', bg: '#eff6ff' },
  Operations:      { color: '#047857', bg: '#ecfdf5' },
  Administrator:   { color: '#6d28d9', bg: '#f5f3ff' },
  Driver:          { color: '#b45309', bg: '#fffbeb' },
  Maintenance:     { color: '#0369a1', bg: '#f0f9ff' },
  Viewer:          { color: '#475569', bg: '#f1f5f9' },
};

export const STATUS_BADGE = {
  // Account / user
  Active:   { color: '#047857', bg: '#ecfdf5' },
  Inactive: { color: '#be123c', bg: '#fff1f2' },
  // Device connectivity
  Online:   { color: '#047857', bg: '#ecfdf5' },
  Offline:  { color: '#475569', bg: '#f1f5f9' },
  // Vehicle motion
  Moving:   { color: '#047857', bg: '#ecfdf5' },
  Stopped:  { color: '#be123c', bg: '#fff1f2' },
  Idle:     { color: '#b45309', bg: '#fffbeb' },
  // Trip lifecycle
  Scheduled:        { color: '#475569', bg: '#f1f5f9' },
  'At Source':      { color: '#b45309', bg: '#fffbeb' },
  'In Transit':     { color: '#1d4ed8', bg: '#eff6ff' },
  'At Destination': { color: '#047857', bg: '#ecfdf5' },
  Completed:        { color: '#047857', bg: '#ecfdf5' },
  Delayed:          { color: '#be123c', bg: '#fff1f2' },
};

export const DEFAULT_BADGE = { color: '#475569', bg: '#f1f5f9' };