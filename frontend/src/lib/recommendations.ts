import type { FileRisk } from "@/types/api";

/**
 * Templated, actionable recommendations derived from the same
 * feature_contributions the backend already returns per file — no new
 * backend field, just a presentation layer over existing data.
 */
export function generateRecommendation(file: FileRisk): string | null {
  const prediction = file.risk_prediction;
  if (!prediction) return null;

  const contributions = prediction.feature_contributions;
  const top = Object.entries(contributions)
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const has = (name: string) => top.slice(0, 2).includes(name);

  if (prediction.risk_category === "low") {
    return "This file's risk factors are within normal range. No action needed right now.";
  }

  if (has("churn") && has("cyclomatic_complexity")) {
    return "High churn and complexity are increasing the risk. Consider splitting this file and adding tests.";
  }
  if (has("bug_fix_frequency") && has("cyclomatic_complexity")) {
    return "This file has both a history of bug fixes and high complexity. Prioritize extra review and regression tests before its next change.";
  }
  if (has("coupling_score")) {
    return "This file changes together with many others (high coupling). Consider reducing its dependencies so changes here are more isolated.";
  }
  if (has("bug_fix_frequency")) {
    return "This file has a history of bug-fix commits. Add regression tests to prevent the same class of issue from recurring.";
  }
  if (has("cyclomatic_complexity")) {
    return "This file's logic is highly branched (high cyclomatic complexity). Consider breaking large functions into smaller, testable units.";
  }
  if (has("churn")) {
    return "This file changes very frequently. Consider stabilizing its interface or extracting the frequently-changing logic into its own module.";
  }
  if (has("developer_count") && file.developer_count <= 1) {
    return "Only one contributor has touched this file. Spread ownership with a code review or pairing session to reduce key-person risk.";
  }
  if (has("loc")) {
    return "This file is large. Consider splitting it into smaller, focused modules.";
  }

  return "Multiple factors contribute moderately to this file's risk. Keep an eye on it as it evolves.";
}
