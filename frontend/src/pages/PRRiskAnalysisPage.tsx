import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitPullRequest, Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { TableSkeleton } from "@/components/skeletons/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, InlineError, extractErrorMessage } from "@/components/ErrorState";
import { prApi, repoApi } from "@/lib/api";
import { formatRelativeDate } from "@/lib/risk";

export function PRRiskAnalysisPage() {
  const { repoId } = useParams();
  const id = Number(repoId);
  const queryClient = useQueryClient();
  const [prNumber, setPrNumber] = useState("");
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const { data: repo } = useQuery({ queryKey: ["repo", id], queryFn: () => repoApi.get(id) });
  const {
    data: prs,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["prs", id], queryFn: () => prApi.list(id) });

  const analyzeMutation = useMutation({
    mutationFn: (num: number) => prApi.analyze(id, num),
    onSuccess: () => {
      setAnalyzeError(null);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["prs", id] }), 4000);
    },
    onError: (err) => setAnalyzeError(extractErrorMessage(err, "Couldn't analyze this pull request.")),
  });

  return (
    <AppShell
      title="Pull Request Risk Analysis"
      actions={
        repo && !repo.is_demo ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const num = Number(prNumber);
              if (num) analyzeMutation.mutate(num);
              setPrNumber("");
            }}
            className="flex items-center gap-2"
          >
            <input value={prNumber} onChange={(e) => setPrNumber(e.target.value)} placeholder="PR #" className="input-field w-24 text-sm" />
            <button type="submit" disabled={analyzeMutation.isPending} className="btn-primary text-xs">
              {analyzeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {analyzeMutation.isPending ? "Analyzing…" : "Analyze PR"}
            </button>
          </form>
        ) : null
      }
    >
      {analyzeError && (
        <div className="mb-4">
          <InlineError message={analyzeError} />
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState description="Couldn't load pull requests for this repository." onRetry={() => refetch()} />
      ) : !prs || prs.length === 0 ? (
        <EmptyState icon={GitPullRequest} title="No pull requests analyzed" description="Analyze a pull request number to see its predicted risk before merging." />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {prs.map((pr) => (
            <Link key={pr.id} to={`/repos/${id}/prs/${pr.id}`} className="card card-hover flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">#{pr.pr_number}</span>
                  <span className="truncate text-sm font-medium text-slate-200">{pr.title}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {pr.author ?? "unknown"} · {pr.state} · {formatRelativeDate(pr.analyzed_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {pr.risk_category && <RiskBadge category={pr.risk_category} showLabel={false} />}
                {pr.risk_score != null && <span className="font-tabular text-sm font-semibold text-slate-200">{pr.risk_score.toFixed(0)}/100</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
