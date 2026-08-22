import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, Check, Copy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { ChartSkeleton } from "@/components/skeletons/Skeletons";
import { prApi } from "@/lib/api";
import { formatPercent } from "@/lib/risk";

export function PRDetailPage() {
  const { repoId, prId } = useParams();
  const id = Number(repoId);
  const pId = Number(prId);
  const [copied, setCopied] = useState(false);

  const { data: pr, isLoading } = useQuery({ queryKey: ["pr", id, pId], queryFn: () => prApi.get(id, pId) });
  const { data: preview } = useQuery({
    queryKey: ["pr-preview", id, pId],
    queryFn: () => prApi.commentPreview(id, pId),
    enabled: !!pr?.analyzed_at,
    retry: false,
  });

  if (isLoading || !pr) {
    return (
      <AppShell title="Pull Request Detail">
        <ChartSkeleton height={340} />
      </AppShell>
    );
  }

  return (
    <AppShell title={`PR #${pr.pr_number}`}>
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{pr.title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {pr.author} · {pr.head_branch} → {pr.base_branch} · {pr.state}
            </p>
          </div>
          {pr.risk_category && <RiskBadge category={pr.risk_category} />}
        </div>
        {pr.summary && <p className="mt-4 text-sm leading-relaxed text-slate-300">{pr.summary}</p>}
        {pr.risk_score != null && (
          <p className="mt-2 text-xs text-slate-500">
            Aggregate risk score: <span className="font-tabular font-semibold text-slate-200">{pr.risk_score.toFixed(0)}/100</span>
          </p>
        )}
      </div>

      {pr.files_changed && pr.files_changed.length > 0 && (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-3 py-3 font-medium">Risk</th>
                <th className="px-3 py-3 font-medium text-right">Probability</th>
                <th className="px-3 py-3 font-medium text-right">+/-</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-700/40">
              {pr.files_changed.map((f) => (
                <tr key={f.file_path}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-300">
                    {f.file_path} {f.is_new_file && <span className="ml-1 text-[10px] text-accent-400">new</span>}
                  </td>
                  <td className="px-3 py-3">{f.risk_category && <RiskBadge category={f.risk_category} showLabel={false} />}</td>
                  <td className="px-3 py-3 text-right font-tabular text-slate-300">
                    {f.defect_probability != null ? formatPercent(f.defect_probability) : "no history"}
                  </td>
                  <td className="px-3 py-3 text-right font-tabular text-xs">
                    <span className="text-emerald-400">+{f.additions}</span> <span className="text-red-400">-{f.deletions}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview && (
        <div className="card mt-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Bot size={15} className="text-accent-400" /> PR-Bot Comment Preview
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(preview.markdown);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="btn-secondary text-xs"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy Markdown"}
            </button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-lg bg-base-950/80 p-4 text-xs leading-relaxed text-slate-400">{preview.markdown}</pre>
          <p className="mt-2 text-[11px] text-slate-600">
            This is the exact markdown a GitHub PR-bot would post. Posting it automatically requires a GitHub App/PAT with pull-request write scope.
          </p>
        </div>
      )}
    </AppShell>
  );
}
