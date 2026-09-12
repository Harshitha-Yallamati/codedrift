import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderGit2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RepoCard } from "@/components/RepoCard";
import { RepoGridSkeleton } from "@/components/skeletons/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { repoApi } from "@/lib/api";

export function DashboardPage() {
  const {
    data: repos,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["repos"], queryFn: repoApi.list });

  return (
    <AppShell
      title="Repositories"
      actions={
        <Link to="/repos/select" className="btn-primary text-sm">
          <Plus size={15} /> Connect Repository
        </Link>
      }
    >
      {isLoading ? (
        <RepoGridSkeleton />
      ) : isError ? (
        <ErrorState description="Couldn't load your repositories." onRetry={() => refetch()} />
      ) : !repos || repos.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No repositories yet"
          description="Connect a GitHub repository to start analyzing defect risk, or explore the demo repositories that ship with CodeDrift."
          action={
            <Link to="/repos/select" className="btn-primary mt-2">
              <Plus size={15} /> Connect Repository
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
