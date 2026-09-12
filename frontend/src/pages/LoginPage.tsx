import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Github, Terminal, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { authApi } from "@/lib/api";
import { InlineError, extractErrorMessage } from "@/components/ErrorState";

export function LoginPage() {
  const { loginDemo } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? "Sign-in failed or your session expired. Please try again." : null
  );

  const handleDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginDemo();
      navigate("/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't start the demo right now. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get("demo") === "1") {
      handleDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 bg-mesh-glow px-6">
      <div className="card w-full max-w-md p-8 animate-slide-up">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30">
          <Terminal size={20} strokeWidth={2.5} />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-white">Sign in to CodeDrift</h1>
        <p className="mt-1.5 text-center text-sm text-slate-500">
          Connect a GitHub repository, or explore the live demo with pre-seeded data.
        </p>

        {error && (
          <div className="mt-5">
            <InlineError message={error} />
          </div>
        )}

        <div className="mt-7 space-y-3">
          <a href={authApi.githubLoginUrl()} className="btn-primary w-full">
            <Github size={16} /> Continue with GitHub
          </a>
          <button onClick={handleDemo} disabled={loading} className="btn-secondary w-full">
            <Sparkles size={16} /> {loading ? "Loading demo…" : "Try the Demo (no login needed)"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          The demo uses realistic pre-seeded repositories so you can explore every page without connecting GitHub.
        </p>
      </div>
    </div>
  );
}
