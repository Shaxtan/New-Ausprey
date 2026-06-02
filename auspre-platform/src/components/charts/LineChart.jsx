import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, chartTooltipProps, axisProps } from './ChartContainer';

export function LineChart({ data, lines = [], height = 220 }) {
  return (
    <ChartContainer height={height}>
      <ReLineChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...chartTooltipProps} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2.5} dot={{ r: 3, fill: l.color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        ))}
      </ReLineChart>
    </ChartContainer>
  );
}

export default LineChart;
