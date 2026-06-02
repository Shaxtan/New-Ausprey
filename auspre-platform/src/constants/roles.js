// Role + status visual mapping. Plain hex (consumed dynamically).
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
  Active:   { color: '#047857', bg: '#ecfdf5' },
  Inactive: { color: '#be123c', bg: '#fff1f2' },
  Online:   { color: '#047857', bg: '#ecfdf5' },
  Offline:  { color: '#475569', bg: '#f1f5f9' },
  Moving:   { color: '#047857', bg: '#ecfdf5' },
  Stopped:  { color: '#b45309', bg: '#fffbeb' },
  Idle:     { color: '#b45309', bg: '#fffbeb' },
};

export const DEFAULT_BADGE = { color: '#475569', bg: '#f1f5f9' };
