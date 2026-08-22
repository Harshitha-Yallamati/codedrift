import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/authContext";

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    loginWithToken(token).then(() => navigate("/dashboard", { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950">
      <p className="text-sm text-slate-500">Signing you in…</p>
    </div>
  );
}
