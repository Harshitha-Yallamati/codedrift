import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { TableSkeleton } from "@/components/skeletons/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { filesApi } from "@/lib/api";
import { formatPercent } from "@/lib/risk";
import type { RiskCategory } from "@/types/api";

const RISK_LEVELS: (RiskCategory | "all")[] = ["all", "critical", "high", "medium", "low"];

export function FileRiskExplorerPage() {
  const { repoId } = useParams();
  const id = Number(repoId);
  const [riskLevel, setRiskLevel] = useState<RiskCategory | "all">("all");
  const [folder, setFolder] = useState("");
  const [fileType, setFileType] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("risk_desc");

  const { data, isLoading } = useQuery({
    queryKey: ["files", id, riskLevel, folder, fileType, sort],
    queryFn: () =>
      filesApi.list(id, {
        risk_level: riskLevel === "all" ? undefined : riskLevel,
        folder: folder || undefined,
        file_type: fileType || undefined,
        sort,
      }),
  });

  const filtered = data?.files.filter((f) => f.file_path.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <AppShell title="File Risk Explorer">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search file path…"
            className="input-field pl-9"
          />
        </div>
        <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Folder prefix…" className="input-field w-40" />
        <input value={fileType} onChange={(e) => setFileType(e.target.value)} placeholder="Extension (e.g. py)" className="input-field w-36" />
        <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as RiskCategory | "all")} className="input-field w-40">
          {RISK_LEVELS.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All risk levels" : r}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-44">
          <option value="risk_desc">Risk: high to low</option>
          <option value="risk_asc">Risk: low to high</option>
          <option value="churn_desc">Churn: high to low</option>
          <option value="complexity_desc">Complexity: high to low</option>
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="No files match" description="Try adjusting your filters or search term." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-3 py-3 font-medium">Risk</th>
                <th className="px-3 py-3 font-medium text-right">Probability</th>
                <th className="px-3 py-3 font-medium text-right">Churn</th>
                <th className="px-3 py-3 font-medium text-right">Complexity</th>
                <th className="px-3 py-3 font-medium text-right">Bug Fixes</th>
                <th className="px-3 py-3 font-medium text-right">Devs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-700/40">
              {filtered.map((f) => (
                <tr key={f.id} className="transition-colors hover:bg-base-800/40">
                  <td className="px-5 py-3">
                    <Link to={`/repos/${id}/files/${f.id}`} className="font-mono text-xs text-slate-200 hover:text-accent-300">
                      {f.file_path}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{f.risk_prediction && <RiskBadge category={f.risk_prediction.risk_category} showLabel={false} />}</td>
                  <td className="px-3 py-3 text-right font-tabular text-slate-300">
                    {f.risk_prediction ? formatPercent(f.risk_prediction.defect_probability) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-tabular text-slate-400">{f.churn}</td>
                  <td className="px-3 py-3 text-right font-tabular text-slate-400">{f.cyclomatic_complexity.toFixed(1)}</td>
                  <td className="px-3 py-3 text-right font-tabular text-slate-400">{f.bug_fix_frequency}</td>
                  <td className="px-3 py-3 text-right font-tabular text-slate-400">{f.developer_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
