import { BarChart as ReBarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, chartTooltipProps, axisProps } from './ChartContainer';

export function BarChart({ data, dataKey = 'value', color = '#2563eb', height = 210, layout = 'horizontal' }) {
  if (layout === 'vertical') {
    return (
      <ChartContainer height={height}>
        <ReBarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey="name" width={120} {...axisProps} tick={{ fontSize: 12, fill: '#475569' }} />
          <Tooltip {...chartTooltipProps} cursor={{ fill: 'rgba(37,99,235,.05)' }} />
          <Bar dataKey={dataKey} radius={[0, 6, 6, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color || color} />)}
          </Bar>
        </ReBarChart>
      </ChartContainer>
    );
  }
  return (
    <ChartContainer height={height}>
      <ReBarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="name" {...axisProps} tick={{ fontSize: 10, fill: '#94a3b8' }} interval={0} />
        <YAxis {...axisProps} />
        <Tooltip {...chartTooltipProps} cursor={{ fill: 'rgba(37,99,235,.05)' }} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color || color} />)}
        </Bar>
      </ReBarChart>
    </ChartContainer>
  );
}

export default BarChart;
