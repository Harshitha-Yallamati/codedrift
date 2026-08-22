import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChartSkeleton } from "@/components/skeletons/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { FeatureImportanceChart } from "@/components/charts/FeatureImportanceChart";
import { CorrelationChart } from "@/components/charts/CorrelationChart";
import { analyticsApi } from "@/lib/api";

const METRIC_ROWS = [
  { key: "accuracy", label: "Accuracy" },
  { key: "precision", label: "Precision" },
  { key: "recall", label: "Recall" },
  { key: "f1_score", label: "F1 Score" },
  { key: "roc_auc", label: "ROC-AUC" },
] as const;

export function AnalyticsPage() {
  const { repoId } = useParams();
  const id = Number(repoId);
  const { data, isLoading, isError } = useQuery({ queryKey: ["analytics", id], queryFn: () => analyticsApi.get(id), retry: false });

  if (isLoading) {
    return (
      <AppShell title="Analytics & Correlations">
        <ChartSkeleton height={340} />
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell title="Analytics & Correlations">
        <EmptyState icon={BarChart3} title="No analytics yet" description="Run an analysis to see model performance and metric correlations." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Analytics & Correlations">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Model Performance</h3>
          {data.model_type === "xgboost" ? (
            <div className="space-y-2.5">
              {METRIC_ROWS.map(({ key, label }) => {
                const value = data[key];
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-tabular font-semibold text-slate-200">{value != null ? `${(value * 100).toFixed(1)}%` : "—"}</span>
                  </div>
                );
              })}
              <div className="mt-3 border-t border-base-700/60 pt-3 text-xs text-slate-500">
                Trained on {data.training_samples ?? "—"} labeled samples using a leakage-free temporal split.
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              This run used the heuristic fallback (not enough historical data to train XGBoost reliably). Model
              performance metrics only apply to trained runs.
            </p>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Feature Importance</h3>
          <FeatureImportanceChart importance={data.feature_importance} />
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">Metric Correlation with Defect Risk</h3>
        <p className="mb-2 text-xs text-slate-500">Pearson correlation between each raw metric and predicted defect probability across analyzed files.</p>
        <CorrelationChart correlations={data.correlations} />
      </div>
    </AppShell>
  );
}
