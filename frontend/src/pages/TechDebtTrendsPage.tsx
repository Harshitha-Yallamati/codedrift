import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChartSkeleton } from "@/components/skeletons/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { ChurnTrendChart, HealthScoreTrendChart } from "@/components/charts/ChurnTrendChart";
import { trendsApi } from "@/lib/api";
import { formatDate } from "@/lib/risk";

export function TechDebtTrendsPage() {
  const { repoId } = useParams();
  const id = Number(repoId);
  const { data, isLoading } = useQuery({ queryKey: ["trends", id], queryFn: () => trendsApi.get(id) });

  if (isLoading) {
    return (
      <AppShell title="Technical Debt Trends">
        <ChartSkeleton height={340} />
      </AppShell>
    );
  }

  if (!data || data.points.length === 0) {
    return (
      <AppShell title="Technical Debt Trends">
        <EmptyState icon={TrendingUp} title="No trend data yet" description="Run at least one analysis to start tracking technical debt over time." />
      </AppShell>
    );
  }

  const points = data.points;
  const first = points[0];
  const last = points[points.length - 1];
  const scoreDelta = (last.health_score ?? 0) - (first.health_score ?? 0);

  return (
    <AppShell title="Technical Debt Trends">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Health Score Change</p>
          <p className={`mt-1 font-tabular text-2xl font-bold ${scoreDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {scoreDelta >= 0 ? "+" : ""}
            {scoreDelta.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(first.started_at)} → {formatDate(last.started_at)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Latest Critical Files</p>
          <p className="mt-1 font-tabular text-2xl font-bold text-red-400">{last.critical_count}</p>
          <p className="mt-1 text-xs text-slate-500">out of {last.files_analyzed} analyzed</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Analysis Runs Tracked</p>
          <p className="mt-1 font-tabular text-2xl font-bold text-slate-200">{points.length}</p>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Health Score Over Time</h3>
        <HealthScoreTrendChart points={points} />
      </div>

      <div className="card mt-4 p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Churn &amp; Complexity Over Time</h3>
        <ChurnTrendChart points={points} />
      </div>
    </AppShell>
  );
}
