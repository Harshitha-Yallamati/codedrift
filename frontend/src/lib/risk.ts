import type { RiskCategory } from "@/types/api";

export const RISK_COLORS: Record<RiskCategory, string> = {
  low: "#34d399",
  medium: "#fbbf24",
  high: "#fb923c",
  critical: "#f87171",
};

export const RISK_LABELS: Record<RiskCategory, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  critical: "Critical Risk",
};

export const RISK_BADGE_CLASSES: Record<RiskCategory, string> = {
  low: "bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25",
  medium: "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/25",
  high: "bg-orange-400/10 text-orange-300 ring-1 ring-inset ring-orange-400/25",
  critical: "bg-red-400/10 text-red-300 ring-1 ring-inset ring-red-400/25",
};

export function healthScoreColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  if (score >= 40) return "#fb923c";
  return "#f87171";
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Standard wording so probability is never presented as certainty. */
export function formatPredictedRisk(value: number): string {
  return `Predicted defect risk: ${Math.round(value * 100)}%`;
}

export function formatRelativeDate(iso: string | null): string {
  if (!iso) return "never";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
