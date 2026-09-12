import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CorrelationEntry } from "@/types/api";
import { CHART_COLORS, tooltipStyle } from "@/components/charts/ChartTheme";

const LABELS: Record<string, string> = {
  churn: "Code Churn",
  commit_frequency: "Commit Frequency",
  bug_fix_frequency: "Bug-fix Frequency",
  file_age_days: "File Age",
  loc: "Lines of Code",
  cyclomatic_complexity: "Cyclomatic Complexity",
  developer_count: "Developer Count",
  coupling_score: "File Coupling",
};

export function CorrelationChart({ correlations }: { correlations: CorrelationEntry[] }) {
  const data = correlations
    .map((c) => ({ name: LABELS[c.metric] ?? c.metric, value: c.correlation_with_risk }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">Not enough files scored yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis type="number" domain={[-1, 1]} stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" stroke={CHART_COLORS.axis} fontSize={11} width={140} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(2)} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= 0 ? "#fb923c" : CHART_COLORS.accent2} />
          ))}
          <LabelList dataKey="value" position="right" formatter={(v: number) => v.toFixed(2)} fill="#94a3b8" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
