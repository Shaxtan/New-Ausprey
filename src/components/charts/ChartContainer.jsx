import { ResponsiveContainer } from 'recharts';

export const chartTooltipProps = {
  contentStyle: {
    borderRadius: 12, border: '1px solid #e2e8f0',
    boxShadow: '0 10px 30px -12px rgba(15,23,42,.25)', fontSize: 12, padding: '8px 12px',
  },
  labelStyle: { color: '#0f172a', fontWeight: 700, marginBottom: 2 },
  itemStyle: { color: '#475569', fontWeight: 600 },
};

export const axisProps = { tick: { fontSize: 11, fill: '#94a3b8' }, axisLine: false, tickLine: false };

export function ChartContainer({ height = 220, children }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );
}

export default ChartContainer;
