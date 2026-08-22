import { AlertTriangle, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import type { RiskCategory } from "@/types/api";
import { RISK_BADGE_CLASSES, RISK_LABELS } from "@/lib/risk";

const ICONS: Record<RiskCategory, typeof CheckCircle2> = {
  low: CheckCircle2,
  medium: AlertCircle,
  high: AlertTriangle,
  critical: XCircle,
};

export function RiskBadge({ category, showLabel = true }: { category: RiskCategory; showLabel?: boolean }) {
  const Icon = ICONS[category];
  return (
    <span className={`badge ${RISK_BADGE_CLASSES[category]}`}>
      <Icon size={12} strokeWidth={2.5} />
      {showLabel ? RISK_LABELS[category] : category}
    </span>
  );
}
