import { Link } from "react-router-dom";
import { Terminal, Github, ArrowRight, Activity, Brain, GitPullRequest, BarChart3, ShieldAlert, Zap } from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "ML Defect Prediction", desc: "XGBoost models trained on your repository's own history predict which files are likely to cause bugs." },
  { icon: Activity, title: "Codebase Health Score", desc: "A single, trustworthy score for every repository — with a full breakdown of what's driving it." },
  { icon: ShieldAlert, title: "Risk Heatmaps", desc: "Instantly see which files and folders are low, medium, high, or critical risk." },
  { icon: GitPullRequest, title: "PR Risk Analysis", desc: "Know the blast radius of a pull request before you merge it — built to power a PR-bot." },
  { icon: BarChart3, title: "Correlations & Trends", desc: "See exactly which metrics predict bugs, and track technical debt over time." },
  { icon: Zap, title: "Live GitHub Sync", desc: "Webhook-driven re-analysis keeps risk scores fresh after every push." },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-base-950 bg-grid-fade">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30">
            <Terminal size={16} strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">CodeDrift</span>
        </div>
        <Link to="/login" className="btn-secondary text-sm">
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-16 text-center">
        <span className="badge bg-accent-500/10 text-accent-300 ring-1 ring-inset ring-accent-500/25 mx-auto">
          <Zap size={12} /> ML-powered technical debt monitoring
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Know which files will <span className="text-gradient">break next</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg">
          CodeDrift analyzes your Git history, code metrics, and commit patterns with XGBoost to predict defect-prone
          files — before they cause an incident.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/login" className="btn-primary">
            <Github size={16} /> Connect GitHub
          </Link>
          <Link to="/login?demo=1" className="btn-secondary">
            View Live Demo <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400">
                <Icon size={18} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-100">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-base-700/60 py-8 text-center text-xs text-slate-600">
        Built with FastAPI, XGBoost, PostgreSQL, Celery, and React — a CodeDrift portfolio project.
      </footer>
    </div>
  );
}
