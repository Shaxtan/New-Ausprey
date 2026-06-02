const numberFmt = new Intl.NumberFormat('en-US');

export const formatNumber = (n) => (n == null ? '—' : numberFmt.format(n));
export const formatKm = (n) => (n == null ? '—' : `${numberFmt.format(n)} km`);
export const formatPercent = (n, digits = 1) => (n == null ? '—' : `${Number(n).toFixed(digits)}%`);

export const formatDateTime = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const formatRelative = (value) => {
  const d = new Date(value);
  const diff = Math.round((Date.now() - d.getTime()) / 60000);
  if (Number.isNaN(diff)) return String(value);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
};

export const initialsOf = (name = '') =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
