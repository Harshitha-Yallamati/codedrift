import { Link } from "react-router-dom";
import { GitBranch, Star, Clock, Lock } from "lucide-react";
import type { Repository } from "@/types/api";
import { HealthScoreGauge } from "@/components/HealthScoreGauge";
import { formatRelativeDate } from "@/lib/risk";

export function RepoCard({ repo }: { repo: Repository }) {
  const counts = repo.risk_category_counts;
  return (
    <Link
      to={`/repos/${repo.id}/health`}
      className="card card-hover group flex flex-col justify-between p-5 animate-slide-up"
    >
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
        <span className="flex items-center gap-1"><Star size={12} /> {repo.stars}</span>
        <span className="flex items-center gap-1"><GitBranch size={12} /> {repo.default_branch}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {formatRelativeDate(repo.last_analyzed_at)}</span>
      </div>

      {counts && (
        <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-base-800">
          {(["low", "medium", "high", "critical"] as const).map((cat) => {
            const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
            const pct = (counts[cat] / total) * 100;
            const colors = { low: "bg-emerald-400", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };
            return pct > 0 ? <div key={cat} className={colors[cat]} style={{ width: `${pct}%` }} /> : null;
          })}
        </div>
      )}

      {repo.is_demo && (
        <span className="mt-3 inline-flex w-fit items-center rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-400 ring-1 ring-accent-500/20">
          Demo Data
        </span>
      )}
    </Link>
  );
}
