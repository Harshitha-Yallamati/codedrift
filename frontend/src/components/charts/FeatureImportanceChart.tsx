import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, tooltipStyle } from "@/components/charts/ChartTheme";

const FEATURE_LABELS: Record<string, string> = {
  churn: "Code Churn",
  commit_frequency: "Commit Frequency",
  bug_fix_frequency: "Bug-fix Frequency",
  file_age_days: "File Age",
  loc: "Lines of Code",
  cyclomatic_complexity: "Cyclomatic Complexity",
  developer_count: "Developer Count",
  coupling_score: "File Coupling",
};

export function FeatureImportanceChart({ importance }: { importance: Record<string, number> }) {
  const data = Object.entries(importance)
    .map(([key, value]) => ({ name: FEATURE_LABELS[key] ?? key, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">No trained model for this run</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis type="number" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
        <YAxis type="category" dataKey="name" stroke={CHART_COLORS.axis} fontSize={11} width={140} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS.accent} fillOpacity={1 - i * 0.09} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
