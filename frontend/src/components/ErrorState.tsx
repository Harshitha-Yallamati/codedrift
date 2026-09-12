import { AlertTriangle, RotateCw } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  description = "This request failed. Check your connection and try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-1">
          <RotateCw size={15} />
          Try again
        </button>
      )}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
      <AlertTriangle size={15} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function extractErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}
