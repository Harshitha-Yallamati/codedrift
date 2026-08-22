import { apiClient } from "@/lib/apiClient";
import type {
  AnalysisRun,
  AnalyticsResponse,
  FileDetailResponse,
  FileListResponse,
  GitHubRepoOption,
  HealthSummary,
  PRCommentPreview,
  PullRequest,
  Repository,
  TokenResponse,
  TrendsResponse,
  User,
  WebhookInfo,
} from "@/types/api";

export const authApi = {
  loginDemo: () => apiClient.post<TokenResponse>("/auth/demo").then((r) => r.data),
  me: () => apiClient.get<User>("/auth/me").then((r) => r.data),
  logout: () => apiClient.post("/auth/logout"),
  githubLoginUrl: () => `${apiClient.defaults.baseURL}/auth/github/login`,
};

export const repoApi = {
  list: () => apiClient.get<Repository[]>("/repos").then((r) => r.data),
  listGitHub: () => apiClient.get<GitHubRepoOption[]>("/repos/github").then((r) => r.data),
  connect: (payload: Partial<GitHubRepoOption> & { full_name: string }) =>
    apiClient.post<Repository>("/repos/connect", payload).then((r) => r.data),
  get: (repoId: number) => apiClient.get<Repository>(`/repos/${repoId}`).then((r) => r.data),
  disconnect: (repoId: number) => apiClient.delete(`/repos/${repoId}`),
  analyze: (repoId: number, branch?: string) =>
    apiClient.post(`/repos/${repoId}/analyze`, { branch, trigger: "manual" }).then((r) => r.data),
  runs: (repoId: number) => apiClient.get<AnalysisRun[]>(`/repos/${repoId}/analysis-runs`).then((r) => r.data),
  run: (repoId: number, runId: number) =>
    apiClient.get<AnalysisRun>(`/repos/${repoId}/analysis-runs/${runId}`).then((r) => r.data),
  webhookInfo: (repoId: number) => apiClient.get<WebhookInfo>(`/repos/${repoId}/webhook-info`).then((r) => r.data),
};

export const dashboardApi = {
  health: (repoId: number) => apiClient.get<HealthSummary>(`/repos/${repoId}/health`).then((r) => r.data),
};

export const filesApi = {
  list: (
    repoId: number,
    params: { run_id?: number; folder?: string; file_type?: string; risk_level?: string; sort?: string } = {}
  ) => apiClient.get<FileListResponse>(`/repos/${repoId}/files`, { params }).then((r) => r.data),
  detail: (repoId: number, fileMetricId: number) =>
    apiClient.get<FileDetailResponse>(`/repos/${repoId}/files/${fileMetricId}`).then((r) => r.data),
};

export const trendsApi = {
  get: (repoId: number) => apiClient.get<TrendsResponse>(`/repos/${repoId}/trends`).then((r) => r.data),
};

export const analyticsApi = {
  get: (repoId: number, runId?: number) =>
    apiClient.get<AnalyticsResponse>(`/repos/${repoId}/analytics`, { params: { run_id: runId } }).then((r) => r.data),
};

export const prApi = {
  list: (repoId: number) => apiClient.get<PullRequest[]>(`/repos/${repoId}/prs`).then((r) => r.data),
  get: (repoId: number, prId: number) => apiClient.get<PullRequest>(`/repos/${repoId}/prs/${prId}`).then((r) => r.data),
  analyze: (repoId: number, prNumber: number) => apiClient.post(`/repos/${repoId}/prs/${prNumber}/analyze`).then((r) => r.data),
  commentPreview: (repoId: number, prId: number) =>
    apiClient.get<PRCommentPreview>(`/repos/${repoId}/prs/${prId}/comment-preview`).then((r) => r.data),
};

async function downloadFile(path: string, filename: string) {
  const response = await apiClient.get(path, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const exportApi = {
  downloadCsv: (repoId: number, repoName: string) => downloadFile(`/repos/${repoId}/export/csv`, `${repoName}-codedrift.csv`),
  downloadPdf: (repoId: number, repoName: string) => downloadFile(`/repos/${repoId}/export/pdf`, `${repoName}-codedrift.pdf`),
};

export const settingsApi = {
  githubStatus: () => apiClient.get<{ connected: boolean }>("/settings/github-status").then((r) => r.data),
};
