import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Lock, Star, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { InlineError, extractErrorMessage } from "@/components/ErrorState";
import { TableSkeleton } from "@/components/skeletons/Skeletons";
import { repoApi } from "@/lib/api";
import type { GitHubRepoOption } from "@/types/api";

export function RepoSelectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [connectError, setConnectError] = useState<string | null>(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["github-repos"],
    queryFn: repoApi.listGitHub,
    retry: false,
  });

  const connectMutation = useMutation({
    mutationFn: (repo: GitHubRepoOption) =>
      repoApi.connect({
        github_repo_id: repo.github_repo_id,
        full_name: repo.full_name,
        description: repo.description ?? undefined,
        default_branch: repo.default_branch,
        private: repo.private,
        language: repo.language ?? undefined,
        stars: repo.stars,
      }),
    onSuccess: (repo) => {
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      navigate(`/repos/${repo.id}/analyze`);
    },
    onError: (err) => setConnectError(extractErrorMessage(err, "Couldn't connect this repository.")),
  });

  const connectingId = connectMutation.isPending ? connectMutation.variables?.github_repo_id : null;

  return (
    <AppShell title="Connect a Repository">
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <EmptyState icon={Github} title="GitHub isn't connected" description={extractErrorMessage(error, "Sign in with GitHub from the login page to browse and connect your repositories.")} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Github} title="No repositories found" description="We couldn't find any repositories on your GitHub account." />
      ) : (
        <>
          {connectError && (
            <div className="mb-4">
              <InlineError message={connectError} />
            </div>
          )}
          <div className="card divide-y divide-base-700/60">
            {data.map((repo) => (
              <div key={repo.github_repo_id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm font-medium text-slate-100">{repo.full_name}</span>
                    {repo.private && <Lock size={12} className="text-slate-500" />}
                  </div>
                  {repo.description && <p className="mt-1 truncate text-xs text-slate-500">{repo.description}</p>}
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-600">
                    {repo.language && <span>{repo.language}</span>}
                    <span className="flex items-center gap-1">
                      <Star size={11} /> {repo.stars}
                    </span>
                  </div>
                </div>
                <button
                  disabled={repo.already_connected || connectMutation.isPending}
                  onClick={() => {
                    setConnectError(null);
                    connectMutation.mutate(repo);
                  }}
                  className="btn-secondary shrink-0 text-xs"
                >
                  {connectingId === repo.github_repo_id ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Connecting…
                    </>
                  ) : repo.already_connected ? (
                    "Connected"
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
