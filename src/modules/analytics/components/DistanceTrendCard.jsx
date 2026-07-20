import { Card, CardHeader, Skeleton } from '@/components/ui';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const TOOLTIP_STYLE = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 };

export function DistanceTrendCard({ data = [], loading, height = 340 }) {
  return (
    <Card hover className="flex flex-col" style={{ height }}>
      <CardHeader title="Distance Trend" subtitle="This week vs last week (km)" />
      <div className="flex-1 min-h-0 mt-2">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v)}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${v.toLocaleString('en-IN')} km`} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Line type="monotone" dataKey="thisWeek" name="This Week" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="lastWeek" name="Last Week" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export default DistanceTrendCard;