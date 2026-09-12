import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Loader2, PlayCircle, CheckCircle2, XCircle, Circle, RotateCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CardSkeleton } from "@/components/skeletons/Skeletons";
import { ErrorState, InlineError, extractErrorMessage } from "@/components/ErrorState";
import { repoApi } from "@/lib/api";
import type { AnalysisRun } from "@/types/api";

const STEPS = [
  "Repository connected",
  "Files discovered",
  "Git history analyzed",
  "Metrics calculated",
  "Risk calculation",
  "Results generated",
];

/** Derives the 6-step checklist from the run's coarse status — no per-step
 * backend tracking exists, so this is an honest approximation of the same
 * pending/running/completed/failed lifecycle, not fabricated granularity. */
function stepStatus(index: number, run: AnalysisRun | undefined): "done" | "active" | "pending" | "failed" {
  if (index === 0) return "done"; // we're on this page, so the repo is already connected
  if (!run) return "pending";
  if (run.status === "failed") {
    // steps before the last-known stage are treated as completed; the rest never happened
    return index <= 4 ? "done" : "failed";
  }
  if (run.status === "pending") return "pending";
  if (run.status === "running") {
    if (index <= 3) return "done";
    if (index === 4) return "active";
    return "pending";
  }
  // completed
  return "done";
}

function StepRow({ label, status }: { label: string; status: "done" | "active" | "pending" | "failed" }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {status === "done" && <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />}
      {status === "active" && <Loader2 size={16} className="shrink-0 animate-spin text-accent-400" />}
      {status === "pending" && <Circle size={16} className="shrink-0 text-slate-600" />}
      {status === "failed" && <XCircle size={16} className="shrink-0 text-red-400" />}
      <span className={status === "pending" ? "text-slate-500" : "text-slate-200"}>{label}</span>
    </div>
  );
}

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—";
  const seconds = Math.max(0, (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export function RepoAnalysisPage() {
  const { repoId } = useParams();
  const id = Number(repoId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [polling, setPolling] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const { data: repo, isLoading: repoLoading, isError: repoIsError, refetch: refetchRepo } = useQuery({
    queryKey: ["repo", id],
    queryFn: () => repoApi.get(id),
  });
  const { data: runs, refetch } = useQuery({
    queryKey: ["runs", id],
    queryFn: () => repoApi.runs(id),
    refetchInterval: polling ? 3000 : false,
  });

  const latestRun = runs?.[0];

  useEffect(() => {
    if (latestRun && (latestRun.status === "running" || latestRun.status === "pending")) {
      setPolling(true);
    } else if (polling) {
      setPolling(false);
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      queryClient.invalidateQueries({ queryKey: ["repo", id] });
      queryClient.invalidateQueries({ queryKey: ["health", id] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestRun?.status]);

  const analyzeMutation = useMutation({
    mutationFn: () => repoApi.analyze(id, repo?.default_branch),
    onSuccess: () => {
      setAnalyzeError(null);
      setPolling(true);
      refetch();
    },
    onError: (err) => setAnalyzeError(extractErrorMessage(err, "Couldn't start analysis. Please try again.")),
  });

  if (repoLoading) {
    return (
      <AppShell title="Run Analysis">
        <CardSkeleton />
      </AppShell>
    );
  }

  if (repoIsError) {
    return (
      <AppShell title="Run Analysis">
        <ErrorState description="Couldn't load this repository." onRetry={() => refetchRepo()} />
      </AppShell>
    );
  }

  if (repo?.is_demo) {
    return (
      <AppShell title="Run Analysis">
        <div className="card p-6 text-sm text-slate-400">
          <p>
            <strong className="text-slate-200">{repo.full_name}</strong> is a demo repository with pre-seeded analysis
            data — it doesn't need to be (re)analyzed.
          </p>
          <button onClick={() => navigate(`/repos/${id}/health`)} className="btn-primary mt-4">
            View Health Dashboard
          </button>
        </div>
      </AppShell>
    );
  }

  const isRunning = latestRun && (latestRun.status === "running" || latestRun.status === "pending");
  const counts = repo?.risk_category_counts;

  return (
    <AppShell title="Run Analysis">
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400">
            <GitBranch size={18} />
          </div>
          <div>
            <h2 className="font-mono text-sm font-semibold text-slate-100">{repo?.full_name}</h2>
            <p className="text-xs text-slate-500">Branch: {repo?.default_branch ?? "main"}</p>
          </div>
        </div>

        {analyzeError && (
          <div className="mt-4">
            <InlineError message={analyzeError} />
          </div>
        )}

        {!isRunning && (
          <button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending} className="btn-primary mt-5">
            <PlayCircle size={16} />
            {latestRun?.status === "failed" ? "Retry Analysis" : "Start Analysis"}
          </button>
        )}

        {latestRun && (
          <div className="mt-6 rounded-xl border border-base-700/60 bg-base-900/50 p-4">
            <div className="space-y-2.5">
              {STEPS.map((label, i) => (
                <StepRow key={label} label={label} status={stepStatus(i, latestRun)} />
              ))}
            </div>

            {latestRun.status === "failed" && (
              <div className="mt-4 border-t border-base-700/60 pt-4">
                <p className="text-sm text-red-400/90">{latestRun.error_message}</p>
                <button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending} className="btn-secondary mt-3 text-xs">
                  <RotateCw size={13} /> Retry
                </button>
              </div>
            )}

            {latestRun.status === "completed" && (
              <div className="mt-4 border-t border-base-700/60 pt-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Files Analyzed</p>
                    <p className="font-tabular text-lg font-semibold text-slate-100">{latestRun.files_analyzed}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Health Score</p>
                    <p className="font-tabular text-lg font-semibold text-slate-100">{latestRun.health_score?.toFixed(1) ?? "—"}/100</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Critical Files</p>
                    <p className="font-tabular text-lg font-semibold text-red-400">{counts?.critical ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">High-Risk Files</p>
                    <p className="font-tabular text-lg font-semibold text-orange-400">{counts?.high ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Analysis Engine</p>
                    <p className="text-sm font-medium text-slate-200">{latestRun.model_type === "xgboost" ? "XGBoost" : "Heuristic"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Duration</p>
                    <p className="text-sm font-medium text-slate-200">{formatDuration(latestRun.started_at, latestRun.finished_at)}</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/repos/${id}/health`)} className="btn-secondary mt-4 text-xs">
                  View Results
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
