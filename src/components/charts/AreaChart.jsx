import { useId } from 'react';
import { AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, chartTooltipProps, axisProps } from './ChartContainer';

export function AreaChart({ data, dataKey = 'value', color = '#10b981', height = 210 }) {
  const gradientId = useId().replace(/:/g, '');
  return (
    <ChartContainer height={height}>
      <ReAreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...chartTooltipProps} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4 }} />
      </ReAreaChart>
    </ChartContainer>
  );
}

export default AreaChart;
