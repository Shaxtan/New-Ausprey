import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer, chartTooltipProps } from './ChartContainer';

export function DonutChart({ data, centerValue, centerLabel, height = 180 }) {
  return (
    <ChartContainer height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip {...chartTooltipProps} />
        {centerValue !== undefined && (
          <>
            <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 24, fontWeight: 800, fill: '#0f172a' }}>{centerValue}</text>
            <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}>{centerLabel}</text>
          </>
        )}
      </PieChart>
    </ChartContainer>
  );
}

export default DonutChart;
