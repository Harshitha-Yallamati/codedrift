import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Loader2, PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { repoApi } from "@/lib/api";

export function RepoAnalysisPage() {
  const { repoId } = useParams();
  const id = Number(repoId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [polling, setPolling] = useState(false);

  const { data: repo } = useQuery({ queryKey: ["repo", id], queryFn: () => repoApi.get(id) });
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
      queryClient.invalidateQueries({ queryKey: ["health", id] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestRun?.status]);

  const analyzeMutation = useMutation({
    mutationFn: () => repoApi.analyze(id, repo?.default_branch),
    onSuccess: () => {
      setPolling(true);
      refetch();
    },
  });

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

        <button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending || polling}
          className="btn-primary mt-5"
        >
          {polling ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
          {polling ? "Analysis running…" : "Start Analysis"}
        </button>

        {latestRun && (
          <div className="mt-6 rounded-xl border border-base-700/60 bg-base-900/50 p-4 text-sm">
            <div className="flex items-center gap-2">
              {latestRun.status === "completed" && <CheckCircle2 size={16} className="text-emerald-400" />}
              {latestRun.status === "failed" && <XCircle size={16} className="text-red-400" />}
              {(latestRun.status === "running" || latestRun.status === "pending") && (
                <Loader2 size={16} className="animate-spin text-accent-400" />
              )}
              <span className="font-medium text-slate-200 capitalize">{latestRun.status}</span>
              <span className="text-slate-500">· triggered by {latestRun.trigger}</span>
            </div>
            {latestRun.status === "completed" && (
              <p className="mt-2 text-slate-400">
                Analyzed {latestRun.files_analyzed} files using {latestRun.model_type === "xgboost" ? "an XGBoost model" : "the heuristic fallback"}.
                Health score: <strong className="text-slate-200">{latestRun.health_score?.toFixed(1)}</strong>
              </p>
            )}
            {latestRun.status === "failed" && <p className="mt-2 text-red-400/90">{latestRun.error_message}</p>}
            {latestRun.status === "completed" && (
              <button onClick={() => navigate(`/repos/${id}/health`)} className="btn-secondary mt-3 text-xs">
                View Results
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
