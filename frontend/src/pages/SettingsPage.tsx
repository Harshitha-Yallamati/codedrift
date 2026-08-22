import { useQuery } from "@tanstack/react-query";
import { Github, CheckCircle2, XCircle, User as UserIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import { authApi, settingsApi } from "@/lib/api";

export function SettingsPage() {
  const { user } = useAuth();
  const { data: githubStatus } = useQuery({ queryKey: ["github-status"], queryFn: settingsApi.githubStatus });

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
          {githubStatus?.connected ? (
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
