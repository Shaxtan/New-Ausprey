import { Route, CheckCircle2, TrendingUp, IndianRupee } from 'lucide-react';
import { Card, Skeleton } from '@/components/ui';

const ICONS = { route: Route, check: CheckCircle2, trend: TrendingUp, rupee: IndianRupee };
const COLORS = ['#2563eb', '#10b981', '#2563eb', '#10b981'];

export function InsightsBar({ data = [], loading }) {
  return (
    <Card>
      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.map((insight, i) => {
            const Icon = ICONS[insight.icon] ?? TrendingUp;
            const color = COLORS[i % COLORS.length];
            return (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}1a` }}
                >
                  <Icon size={15} style={{ color }} />
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">{insight.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default InsightsBar;