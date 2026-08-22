import { NavLink, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  GitBranch,
  Activity,
  FileWarning,
  TrendingUp,
  GitPullRequest,
  BarChart3,
  Settings as SettingsIcon,
  Terminal,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import clsx from "clsx";

const REPO_NAV = [
  { to: "health", label: "Health Dashboard", icon: Activity },
  { to: "files", label: "File Risk Explorer", icon: FileWarning },
  { to: "trends", label: "Technical Debt Trends", icon: TrendingUp },
  { to: "prs", label: "Pull Request Risk", icon: GitPullRequest },
  { to: "analytics", label: "Analytics & Correlations", icon: BarChart3 },
];

export function Sidebar() {
  const { repoId } = useParams();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-base-700/60 bg-base-950/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30">
          <Terminal size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-white">CodeDrift</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-accent-500/10 text-accent-300" : "text-slate-400 hover:bg-base-800/70 hover:text-slate-200"
            )
          }
        >
          <LayoutDashboard size={17} />
          Repositories
        </NavLink>

        {repoId && (
          <>
            <div className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              This repository
            </div>
            {REPO_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={`/repos/${repoId}/${to}`}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-accent-500/10 text-accent-300" : "text-slate-400 hover:bg-base-800/70 hover:text-slate-200"
                  )
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
            <div className="mt-1">
              <NavLink
                to={`/repos/${repoId}/analyze`}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-accent-500/10 text-accent-300" : "text-slate-400 hover:bg-base-800/70 hover:text-slate-200"
                  )
                }
              >
                <GitBranch size={17} />
                Run Analysis
              </NavLink>
            </div>
          </>
        )}
      </nav>

      <div className="border-t border-base-700/60 p-3 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-accent-500/10 text-accent-300" : "text-slate-400 hover:bg-base-800/70 hover:text-slate-200"
            )
          }
        >
          <SettingsIcon size={17} />
          Settings
        </NavLink>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-base-700 text-xs font-semibold text-slate-300">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="flex-1 truncate text-sm text-slate-300">{user?.username}</span>
          <button onClick={logout} className="text-slate-500 hover:text-slate-300" title="Log out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
