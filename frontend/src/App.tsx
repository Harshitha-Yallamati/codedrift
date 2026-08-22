import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/lib/authContext";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { RepoSelectPage } from "@/pages/RepoSelectPage";
import { RepoAnalysisPage } from "@/pages/RepoAnalysisPage";
import { HealthDashboardPage } from "@/pages/HealthDashboardPage";
import { FileRiskExplorerPage } from "@/pages/FileRiskExplorerPage";
import { FileDetailPage } from "@/pages/FileDetailPage";
import { TechDebtTrendsPage } from "@/pages/TechDebtTrendsPage";
import { PRRiskAnalysisPage } from "@/pages/PRRiskAnalysisPage";
import { PRDetailPage } from "@/pages/PRDetailPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/repos/select" element={<RequireAuth><RepoSelectPage /></RequireAuth>} />
      <Route path="/repos/:repoId/analyze" element={<RequireAuth><RepoAnalysisPage /></RequireAuth>} />
      <Route path="/repos/:repoId/health" element={<RequireAuth><HealthDashboardPage /></RequireAuth>} />
      <Route path="/repos/:repoId/files" element={<RequireAuth><FileRiskExplorerPage /></RequireAuth>} />
      <Route path="/repos/:repoId/files/:fileMetricId" element={<RequireAuth><FileDetailPage /></RequireAuth>} />
      <Route path="/repos/:repoId/trends" element={<RequireAuth><TechDebtTrendsPage /></RequireAuth>} />
      <Route path="/repos/:repoId/prs" element={<RequireAuth><PRRiskAnalysisPage /></RequireAuth>} />
      <Route path="/repos/:repoId/prs/:prId" element={<RequireAuth><PRDetailPage /></RequireAuth>} />
      <Route path="/repos/:repoId/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
