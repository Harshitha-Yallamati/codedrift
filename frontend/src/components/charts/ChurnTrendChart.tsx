import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/types/api";
import { CHART_COLORS, tooltipStyle } from "@/components/charts/ChartTheme";
import { RISK_COLORS } from "@/lib/risk";
import { formatDate } from "@/lib/risk";

export function ChurnTrendChart({ points }: { points: TrendPoint[] }) {
  const data = points.map((p) => ({ ...p, label: formatDate(p.started_at) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="label" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="avg_churn" stroke={CHART_COLORS.accent} fill="url(#churnGradient)" strokeWidth={2} name="Avg Churn" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ComplexityTrendChart({ points }: { points: TrendPoint[] }) {
  const data = points.map((p) => ({ ...p, label: formatDate(p.started_at) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="complexityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.accent2} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.accent2} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="label" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="avg_complexity" stroke={CHART_COLORS.accent2} fill="url(#complexityGradient)" strokeWidth={2} name="Avg Complexity" />
      </AreaChart>
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

export function RiskTrendChart({ points }: { points: TrendPoint[] }) {
  const data = points.map((p) => ({
    ...p,
    label: formatDate(p.started_at),
    critical: p.critical_count,
    high: p.high_count,
    medium: p.medium_count,
    low: p.low_count,
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="label" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="low" stackId="risk" stroke={RISK_COLORS.low} fill={RISK_COLORS.low} fillOpacity={0.5} name="Low" />
        <Area type="monotone" dataKey="medium" stackId="risk" stroke={RISK_COLORS.medium} fill={RISK_COLORS.medium} fillOpacity={0.5} name="Medium" />
        <Area type="monotone" dataKey="high" stackId="risk" stroke={RISK_COLORS.high} fill={RISK_COLORS.high} fillOpacity={0.5} name="High" />
        <Area type="monotone" dataKey="critical" stackId="risk" stroke={RISK_COLORS.critical} fill={RISK_COLORS.critical} fillOpacity={0.5} name="Critical" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
