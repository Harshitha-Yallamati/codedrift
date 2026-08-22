import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FileCode2, Users, GitCommit, Clock, Link2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { ChartSkeleton } from "@/components/skeletons/Skeletons";
import { filesApi } from "@/lib/api";
import { formatDate, formatPercent } from "@/lib/risk";
import { CHART_COLORS, tooltipStyle } from "@/components/charts/ChartTheme";

const STAT_ITEMS = [
  { key: "churn", label: "Code Churn", icon: GitCommit },
  { key: "commit_frequency", label: "Commit Frequency", icon: GitCommit },
  { key: "bug_fix_frequency", label: "Bug-fix Commits", icon: GitCommit },
  { key: "file_age_days", label: "File Age (days)", icon: Clock },
  { key: "loc", label: "Lines of Code", icon: FileCode2 },
  { key: "cyclomatic_complexity", label: "Complexity", icon: FileCode2 },
  { key: "developer_count", label: "Contributors", icon: Users },
  { key: "coupling_score", label: "Coupling", icon: Link2 },
] as const;

export function FileDetailPage() {
  const { repoId, fileMetricId } = useParams();
  const id = Number(repoId);
  const fmId = Number(fileMetricId);

  const { data, isLoading } = useQuery({ queryKey: ["file", id, fmId], queryFn: () => filesApi.detail(id, fmId) });

  if (isLoading || !data) {
    return (
      <AppShell title="File Detail">
        <ChartSkeleton height={340} />
      </AppShell>
    );
  }

  const { file, history } = data;
  const chartData = history.map((h) => ({ ...h, label: formatDate(h.started_at) }));

  return (
    <AppShell title="File Detail">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-mono text-sm font-semibold text-slate-100">{file.file_path}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {file.language ?? "unknown language"} · complexity computed via {file.complexity_method === "ast" ? "AST parsing" : "heuristic"}
            </p>
          </div>
          {file.risk_prediction && <RiskBadge category={file.risk_prediction.risk_category} />}
        </div>

        {file.risk_prediction && (
          <div className="mt-4 rounded-xl border border-base-700/60 bg-base-900/50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Why this score?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{file.risk_prediction.explanation}</p>
            <p className="mt-2 text-xs text-slate-500">
              {formatPercent(file.risk_prediction.defect_probability)} predicted defect probability · scored by{" "}
              {file.risk_prediction.model_type === "xgboost" ? "XGBoost model" : "heuristic fallback"} ({file.risk_prediction.model_version})
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="rounded-lg border border-base-700/50 bg-base-900/40 p-3">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Icon size={12} />
                <span className="text-[10px] uppercase tracking-wide">{label}</span>
              </div>
              <p className="mt-1 font-tabular text-lg font-semibold text-slate-100">
                {typeof file[key] === "number" ? (Number.isInteger(file[key]) ? file[key] : (file[key] as number).toFixed(2)) : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="card mt-4 p-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Defect Probability Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ left: -16, right: 16 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="label" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPercent(v)} />
              <Line type="monotone" dataKey="defect_probability" stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </AppShell>
  );
}
