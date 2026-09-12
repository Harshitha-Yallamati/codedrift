export type RiskCategory = "low" | "medium" | "high" | "critical";
export type ModelType = "xgboost" | "heuristic";
export type RunStatus = "pending" | "running" | "completed" | "failed";

export interface User {
  id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Repository {
  id: number;
  full_name: string;
  description: string | null;
  default_branch: string;
  private: boolean;
  language: string | null;
  stars: number;
  is_demo: boolean;
  created_at: string;
  last_analyzed_at: string | null;
  health_score: number | null;
  risk_category_counts: Record<RiskCategory, number> | null;
  latest_run_id: number | null;
  model_type: ModelType | null;
  files_analyzed: number | null;
}

export interface GitHubRepoOption {
  github_repo_id: number;
  full_name: string;
  description: string | null;
  default_branch: string;
  private: boolean;
  language: string | null;
  stars: number;
  already_connected: boolean;
}

export interface WebhookInfo {
  webhook_url: string;
  secret: string;
  events: string[];
}

export interface AnalysisRun {
  id: number;
  repository_id: number;
  branch: string;
  status: RunStatus;
  trigger: string;
  commit_sha: string | null;
  model_type: ModelType | null;
  model_version: string | null;
  health_score: number | null;
  files_analyzed: number;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  roc_auc: number | null;
  feature_importance: Record<string, number> | null;
  training_samples: number | null;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
}

export interface RiskPrediction {
  defect_probability: number;
  risk_category: RiskCategory;
  model_type: ModelType;
  model_version: string;
  explanation: string;
  feature_contributions: Record<string, number>;
}

export interface FileRisk {
  id: number;
  file_path: string;
  language: string | null;
  churn: number;
  commit_frequency: number;
  bug_fix_frequency: number;
  file_age_days: number;
  loc: number;
  cyclomatic_complexity: number;
  developer_count: number;
  coupling_score: number;
  complexity_method: "ast" | "heuristic";
  risk_prediction: RiskPrediction | null;
}

export interface FileListResponse {
  repository_id: number;
  run_id: number;
  total: number;
  files: FileRisk[];
}

export interface FileHistoryPoint {
  run_id: number;
  started_at: string;
  defect_probability: number | null;
  risk_category: RiskCategory | null;
  churn: number;
  cyclomatic_complexity: number;
}

export interface FileDetailResponse {
  file: FileRisk;
  history: FileHistoryPoint[];
}

export interface HealthSummary {
  repository_id: number;
  health_score: number;
  risk_category_counts: Record<RiskCategory, number>;
  total_files: number;
  model_type: ModelType | null;
  model_version: string | null;
  last_analyzed_at: string | null;
  top_risky_files: FileRisk[];
}

export interface TrendPoint {
  run_id: number;
  started_at: string;
  health_score: number | null;
  avg_churn: number;
  avg_complexity: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  files_analyzed: number;
}

export interface TrendsResponse {
  repository_id: number;
  points: TrendPoint[];
  has_sufficient_history: boolean;
}

export interface CorrelationEntry {
  metric: string;
  correlation_with_risk: number;
}

export interface AnalyticsResponse {
  repository_id: number;
  run_id: number;
  model_type: ModelType | null;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  roc_auc: number | null;
  training_samples: number | null;
  feature_importance: Record<string, number>;
  correlations: CorrelationEntry[];
}

export interface PRFileRisk {
  file_path: string;
  additions: number;
  deletions: number;
  defect_probability: number | null;
  risk_category: RiskCategory | null;
  is_new_file: boolean;
}

export interface PullRequest {
  id: number;
  repository_id: number;
  pr_number: number;
  title: string;
  author: string | null;
  state: "open" | "closed" | "merged";
  base_branch: string | null;
  head_branch: string | null;
  risk_score: number | null;
  risk_category: RiskCategory | null;
  files_changed: PRFileRisk[] | null;
  summary: string | null;
  analyzed_at: string | null;
  created_at: string;
}

export interface PRCommentPreview {
  pr_id: number;
  markdown: string;
}
