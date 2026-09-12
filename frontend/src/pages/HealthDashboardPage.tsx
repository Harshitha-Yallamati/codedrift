import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, FileWarning, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HealthScoreGauge } from "@/components/HealthScoreGauge";
import { RiskBadge } from "@/components/RiskBadge";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ChartSkeleton } from "@/components/skeletons/Skeletons";
import { dashboardApi, exportApi, repoApi } from "@/lib/api";
import { formatPredictedRisk, formatRelativeDate } from "@/lib/risk";

export function HealthDashboardPage() {
  const { repoId } = useParams();
  const id = Number(repoId);

  const { data: repo } = useQuery({ queryKey: ["repo", id], queryFn: () => repoApi.get(id) });
  const {
    data: health,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["health", id], queryFn: () => dashboardApi.health(id) });

  if (isLoading) {
    return (
      <AppShell title="Codebase Health">
        <ChartSkeleton height={340} />
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Codebase Health">
        <ErrorState description="Couldn't load the health summary for this repository." onRetry={() => refetch()} />
      </AppShell>
    );
  }

  if (!health || health.total_files === 0) {
    return (
      <AppShell title="Codebase Health">
        <EmptyState
          icon={Sparkles}
          title="No analysis yet"
          description="Run an analysis on this repository to see its codebase health score, risk heatmap, and top risky files."
          action={
            <Link to={`/repos/${id}/analyze`} className="btn-primary mt-2">
              Run Analysis
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Codebase Health"
      actions={
        <>
          <button onClick={() => repo && exportApi.downloadCsv(id, repo.full_name)} className="btn-secondary text-xs">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => repo && exportApi.downloadPdf(id, repo.full_name)} className="btn-secondary text-xs">
            <Download size={14} /> PDF
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center gap-3 p-6">
          <p className="text-sm font-semibold text-slate-200">Health Score: {Math.round(health.health_score)}/100</p>
          <HealthScoreGauge score={health.health_score} size={140} />
          <p className="text-center text-xs text-slate-500">Higher score = healthier repository.</p>
          <p className="text-center text-xs text-slate-500">
            {health.total_files} files analyzed · {health.model_type === "xgboost" ? "XGBoost model" : "Heuristic fallback"}
            <br />
            Last analyzed {formatRelativeDate(health.last_analyzed_at)}
          </p>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Risk Distribution</h3>
          <p className="mb-3 text-xs text-slate-500">Click a category to see those files in the File Risk Explorer.</p>
          <div className="flex flex-wrap items-center gap-6">
            <RiskDistributionChart counts={health.risk_category_counts} />
            <div className="flex-1 space-y-2">
              {(["critical", "high", "medium", "low"] as const).map((cat) => (
                <Link
                  key={cat}
                  to={`/repos/${id}/files?risk=${cat}`}
                  className="flex items-center justify-between gap-6 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-base-800/60"
                >
                  <RiskBadge category={cat} />
                  <span className="font-tabular text-slate-300">{health.risk_category_counts[cat] ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RiskHeatmap files={health.top_risky_files} />
        </div>

        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <FileWarning size={15} className="text-orange-400" /> Top Risky Files
          </h3>
          <div className="space-y-3">
            {health.top_risky_files.slice(0, 6).map((f) => (
              <Link
                key={f.id}
                to={`/repos/${id}/files/${f.id}`}
                className="block rounded-lg border border-base-700/50 bg-base-900/40 p-3 transition-colors hover:border-accent-500/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs text-slate-300">{f.file_path}</span>
                  {f.risk_prediction && <RiskBadge category={f.risk_prediction.risk_category} showLabel={false} />}
                </div>
                {f.risk_prediction && (
                  <span className="mt-1 block text-[11px] text-slate-500">
                    {formatPredictedRisk(f.risk_prediction.defect_probability)}
                  </span>
                )}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                  <span>Churn {f.churn}</span>
                  <span>Complexity {f.cyclomatic_complexity.toFixed(1)}</span>
                  <span>Bug fixes {f.bug_fix_frequency}</span>
                  <span>Devs {f.developer_count}</span>
                </div>
              </Link>
            ))}
          </div>
          <Link to={`/repos/${id}/files`} className="mt-3 block text-center text-xs font-medium text-accent-400 hover:text-accent-300">
            View all files →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
