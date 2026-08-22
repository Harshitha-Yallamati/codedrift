import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { RISK_COLORS, RISK_LABELS } from "@/lib/risk";
import { tooltipStyle } from "@/components/charts/ChartTheme";
import type { RiskCategory } from "@/types/api";

export function RiskDistributionChart({ counts }: { counts: Record<RiskCategory, number> }) {
  const data = (["low", "medium", "high", "critical"] as const)
    .map((cat) => ({ name: RISK_LABELS[cat], value: counts[cat] ?? 0, cat }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
          {data.map((d) => (
            <Cell key={d.cat} fill={RISK_COLORS[d.cat]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
