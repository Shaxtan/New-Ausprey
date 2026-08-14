import {
  BarChart as ReBarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartContainer, chartTooltipProps, axisProps } from "./ChartContainer";

// Renders the bar's value INSIDE it, anchored to the end (right edge for a
// vertical/horizontal-bar layout). A white halo (stroke behind the fill)
// keeps the text legible whether the bar underneath is a dark or pale shade.
function InBarValueLabel({ x, y, width, height, value, formatter }) {
  if (value == null) return null;
  const text = typeof formatter === "function" ? formatter(value) : value;
  return (
    <text
      x={x + width - 8}
      y={y + height / 2}
      textAnchor="end"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
      fill="#0f172a"
      stroke="#ffffff"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

export function BarChart({
  data,
  dataKey = "value",
  color = "#2563eb",
  height = 210,
  layout = "horizontal",
  showValueLabels = false,
  valueFormatter,
  onBarClick,
}) {
  if (layout === "vertical") {
    return (
      <ChartContainer height={height}>
        <ReBarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#eef2f7"
          />
          <XAxis type="number" {...axisProps} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            {...axisProps}
            tick={{ fontSize: 12, fill: "#475569" }}
          />
          <Tooltip
            {...chartTooltipProps}
            cursor={{ fill: "rgba(37,99,235,.05)" }}
          />
          <Bar
            dataKey={dataKey}
            radius={[0, 6, 6, 0]}
            onClick={onBarClick}
            style={onBarClick ? { cursor: "pointer" } : undefined}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color || color} />
            ))}
            {showValueLabels && (
              <LabelList
                dataKey={dataKey}
                content={(props) => (
                  <InBarValueLabel {...props} formatter={valueFormatter} />
                )}
              />
            )}
          </Bar>
        </ReBarChart>
      </ChartContainer>
    );
  }
  return (
    <ChartContainer height={height}>
      <ReBarChart
        data={data}
        margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
        barCategoryGap="28%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#eef2f7"
        />
        <XAxis
          dataKey="name"
          {...axisProps}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          interval={0}
        />
        <YAxis {...axisProps} />
        <Tooltip
          {...chartTooltipProps}
          cursor={{ fill: "rgba(37,99,235,.05)" }}
        />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || color} />
          ))}
        </Bar>
      </ReBarChart>
    </ChartContainer>
  );
}

export default BarChart;
