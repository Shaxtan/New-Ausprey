import { Card, CardHeader, Skeleton } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const TOOLTIP_STYLE = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 };

export function FuelConsumptionCard({ data = [], loading, height = 340 }) {
  return (
    <Card hover className="flex flex-col" style={{ height }}>
      <CardHeader title="Fuel Consumption Trend" subtitle="This week vs last week (Ltr)" />
      <div className="flex-1 min-h-0 mt-2">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v)}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${v.toLocaleString('en-IN')} Ltr`} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Bar dataKey="thisWeek" name="This Week" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="lastWeek" name="Last Week" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export default FuelConsumptionCard;