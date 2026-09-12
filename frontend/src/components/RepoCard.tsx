import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Star, Clock, Lock, Cpu, FileStack, PlayCircle, Settings as SettingsIcon, Trash2 } from "lucide-react";
import type { Repository } from "@/types/api";
import { HealthScoreGauge } from "@/components/HealthScoreGauge";
import { formatRelativeDate } from "@/lib/risk";
import { repoApi } from "@/lib/api";
import { extractErrorMessage } from "@/components/ErrorState";

const RISK_DOT: Record<string, string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-red-400",
};

const MODEL_LABEL: Record<string, string> = {
  xgboost: "XGBoost",
  heuristic: "Heuristic",
};

export function RepoCard({ repo }: { repo: Repository }) {
  const counts = repo.risk_category_counts;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [removeError, setRemoveError] = useState<string | null>(null);

  const removeMutation = useMutation({
    mutationFn: () => repoApi.disconnect(repo.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["repos"] }),
    onError: (err) => setRemoveError(extractErrorMessage(err, "Couldn't remove this repository.")),
  });

  const handleRemove = () => {
    if (repo.is_demo) return;
    setRemoveError(null);
    if (window.confirm(`Remove ${repo.full_name}? This deletes all of its analysis history.`)) {
      removeMutation.mutate();
    }
  };

  return (
    <div className="card card-hover group flex flex-col justify-between p-5 animate-slide-up">
      <Link to={`/repos/${repo.id}/health`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-mono text-sm font-semibold text-slate-100 group-hover:text-accent-300">
                {repo.full_name}
              </h3>
              {repo.private && <Lock size={12} className="shrink-0 text-slate-500" />}
            </div>
            {repo.description && <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{repo.description}</p>}
          </div>
          {repo.health_score != null && <HealthScoreGauge score={repo.health_score} size={64} />}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-400" />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star size={12} /> {repo.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch size={12} /> {repo.default_branch}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {formatRelativeDate(repo.last_analyzed_at)}
          </span>
        </div>

        {(repo.files_analyzed != null || repo.model_type) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            {repo.files_analyzed != null && (
              <span className="flex items-center gap-1">
                <FileStack size={12} /> {repo.files_analyzed} files analyzed
              </span>
            )}
            {repo.model_type && (
              <span className="flex items-center gap-1">
                <Cpu size={12} /> {MODEL_LABEL[repo.model_type] ?? repo.model_type}
              </span>
            )}
          </div>
        )}

        {counts && (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {(["critical", "high", "medium", "low"] as const).map((cat) =>
                counts[cat] > 0 ? (
                  <span key={cat} className="flex items-center gap-1.5 text-slate-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${RISK_DOT[cat]}`} />
                    {counts[cat]} {cat}
                  </span>
                ) : null
              )}
            </div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-base-800">
              {(["low", "medium", "high", "critical"] as const).map((cat) => {
                const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
                const pct = (counts[cat] / total) * 100;
                return pct > 0 ? <div key={cat} className={RISK_DOT[cat]} style={{ width: `${pct}%` }} /> : null;
              })}
            </div>
          </>
        )}

        {repo.is_demo && (
          <span className="mt-3 inline-flex w-fit items-center rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-400 ring-1 ring-accent-500/20">
            Demo Data
          </span>
        )}
      </Link>

      {removeError && <p className="mt-3 text-xs text-red-400">{removeError}</p>}

      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-base-700/60 pt-3">
        <button
          onClick={() => navigate(`/repos/${repo.id}/health`)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-base-800 hover:text-slate-200"
        >
          Open Dashboard
        </button>
        <button
          onClick={() => navigate(`/repos/${repo.id}/analyze`)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-base-800 hover:text-slate-200"
        >
          <PlayCircle size={13} /> Run Analysis
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-base-800 hover:text-slate-200"
        >
          <SettingsIcon size={13} /> Settings
        </button>
        <button
          onClick={handleRemove}
          disabled={repo.is_demo || removeMutation.isPending}
          title={repo.is_demo ? "Demo repositories can't be removed" : "Remove repository"}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
        >
          <Trash2 size={13} /> Remove
        </button>
      </div>
    </div>
  );
}
