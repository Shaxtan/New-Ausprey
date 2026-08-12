import { Card, CardHeader, Button } from '@/components/ui';
import { ChevronRight } from 'lucide-react';

/**
 * Shared layout for the three summary cards on the General tab
 * (User & Role Settings / Device & Data Settings / Security Settings).
 * `rows` values below (counts, durations, etc.) are static placeholders —
 * wire real data by passing computed `rows` once the backend fields exist.
 */
export function QuickLinkSummaryCard({ icon: Icon, title, rows, actionLabel, onAction }) {
  return (
    <Card>
      <CardHeader title={title} icon={Icon} />
      <div className="space-y-1">
        {rows.map((r) => (
          <button
            key={r.label}
            onClick={r.onClick}
            className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 rounded-lg px-1.5 -mx-1.5 transition"
          >
            {r.rowIcon && <r.rowIcon size={16} className="text-slate-400 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">{r.label}</p>
              {r.sub && <p className="text-xs text-slate-400">{r.sub}</p>}
            </div>
            {r.value && (
              <span className={r.valueClassName ?? 'text-sm font-bold text-slate-700'}>
                {r.value}
              </span>
            )}
            {r.chevron !== false && <ChevronRight size={15} className="text-slate-300 shrink-0" />}
          </button>
        ))}
      </div>
      {actionLabel && (
        <div className="mt-4">
          <Button variant="secondary" onClick={onAction} className="w-full justify-center">
            {actionLabel}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default QuickLinkSummaryCard;