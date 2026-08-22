import { Area, AreaChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/types/api";
import { CHART_COLORS, tooltipStyle } from "@/components/charts/ChartTheme";
import { formatDate } from "@/lib/risk";

export function ChurnTrendChart({ points }: { points: TrendPoint[] }) {
  const data = points.map((p) => ({ ...p, label: formatDate(p.started_at) }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="label" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area yAxisId="left" type="monotone" dataKey="avg_churn" stroke={CHART_COLORS.accent} fill="url(#churnGradient)" strokeWidth={2} name="Avg Churn" />
        <Line yAxisId="right" type="monotone" dataKey="avg_complexity" stroke={CHART_COLORS.accent2} strokeWidth={2} dot={false} name="Avg Complexity" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function HealthScoreTrendChart({ points }: { points: TrendPoint[] }) {
  const data = points.map((p) => ({ ...p, label: formatDate(p.started_at) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.accent2} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.accent2} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="label" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="health_score" stroke={CHART_COLORS.accent2} fill="url(#healthGradient)" strokeWidth={2} name="Health Score" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
