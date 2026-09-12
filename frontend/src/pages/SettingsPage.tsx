import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, CheckCircle2, XCircle, User as UserIcon, FolderGit2, ChevronDown, ChevronUp, Copy, Check, Trash2, GitBranch } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CardSkeleton } from "@/components/skeletons/Skeletons";
import { InlineError, extractErrorMessage } from "@/components/ErrorState";
import { useAuth } from "@/lib/authContext";
import { authApi, repoApi, settingsApi } from "@/lib/api";
import type { Repository } from "@/types/api";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-slate-500 hover:text-slate-300"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

function RepoSettingsRow({ repo }: { repo: Repository }) {
  const [expanded, setExpanded] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: webhook, isLoading: webhookLoading } = useQuery({
    queryKey: ["webhook-info", repo.id],
    queryFn: () => repoApi.webhookInfo(repo.id),
    enabled: expanded,
  });

  const removeMutation = useMutation({
    mutationFn: () => repoApi.disconnect(repo.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["repos"] }),
    onError: (err) => setRemoveError(extractErrorMessage(err, "Couldn't remove this repository.")),
  });

  return (
    <div className="border-b border-base-700/60 py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm text-slate-200">{repo.full_name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <GitBranch size={11} /> Analyzed branch: {repo.default_branch}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-base-800 hover:text-slate-200"
          >
            Webhook {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={() => {
              setRemoveError(null);
              if (window.confirm(`Remove ${repo.full_name}? This deletes all of its analysis history.`)) {
                removeMutation.mutate();
              }
            }}
            disabled={repo.is_demo || removeMutation.isPending}
            title={repo.is_demo ? "Demo repositories can't be removed" : "Remove repository"}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {removeError && (
        <div className="mt-2">
          <InlineError message={removeError} />
        </div>
      )}

      {expanded && (
        <div className="mt-3 rounded-lg border border-base-700/60 bg-base-900/50 p-3 text-xs">
          {webhookLoading ? (
            <p className="text-slate-500">Loading…</p>
          ) : webhook ? (
            <div className="space-y-2">
              <div>
                <p className="mb-1 text-slate-500">Payload URL</p>
                <div className="flex items-center gap-2 rounded-md bg-base-950 px-2 py-1.5 font-mono text-slate-300">
                  <span className="min-w-0 flex-1 truncate">{webhook.webhook_url}</span>
                  <CopyButton value={webhook.webhook_url} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-slate-500">Secret</p>
                <div className="flex items-center gap-2 rounded-md bg-base-950 px-2 py-1.5 font-mono text-slate-300">
                  <span className="min-w-0 flex-1 truncate">{webhook.secret}</span>
                  <CopyButton value={webhook.secret} />
                </div>
              </div>
              <p className="text-slate-600">
                Add this as a webhook in your GitHub repo settings (Settings → Webhooks) with content type
                application/json, so pushes and pull requests trigger automatic re-analysis.
              </p>
            </div>
          ) : (
            <p className="text-slate-500">Couldn't load webhook info.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const { data: githubStatus, isLoading: githubStatusLoading } = useQuery({
    queryKey: ["github-status"],
    queryFn: settingsApi.githubStatus,
  });
  const { data: repos, isLoading: reposLoading } = useQuery({ queryKey: ["repos"], queryFn: repoApi.list });

  const connectedRepos = repos?.filter((r) => !r.is_demo) ?? [];

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl space-y-4">
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <UserIcon size={15} /> Account
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Username</span>
            <span className="text-slate-200">{user?.username}</span>
          </div>
          {user?.email && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Email</span>
              <span className="text-slate-200">{user.email}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Account type</span>
            <span className="text-slate-200">{user?.is_demo ? "Demo account" : "GitHub account"}</span>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Github size={15} /> GitHub Connection
          </h3>
          {githubStatusLoading ? (
            <div className="h-5 w-48 skeleton" />
          ) : githubStatus?.connected ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={16} /> Connected — repository analysis and webhooks are available.
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <XCircle size={16} className="text-slate-500" /> Not connected.
              </div>
              <a href={authApi.githubLoginUrl()} className="btn-primary mt-3 text-sm">
                <Github size={15} /> Connect GitHub
              </a>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <FolderGit2 size={15} /> Repository Settings
          </h3>
          {reposLoading ? (
            <CardSkeleton />
          ) : connectedRepos.length === 0 ? (
            <p className="text-sm text-slate-500">No connected (non-demo) repositories yet.</p>
          ) : (
            <div>
              {connectedRepos.map((repo) => (
                <RepoSettingsRow key={repo.id} repo={repo} />
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">About CodeDrift</h3>
          <p className="text-sm leading-relaxed text-slate-500">
            CodeDrift analyzes Git history and code metrics with an XGBoost defect-risk model (heuristic fallback when
            history is sparse) to flag files likely to cause future bugs. Built with FastAPI, Celery, PostgreSQL,
            scikit-learn/XGBoost, and React.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
