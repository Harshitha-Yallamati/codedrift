import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronUp, ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { TableSkeleton } from "@/components/skeletons/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { filesApi } from "@/lib/api";
import { formatPercent } from "@/lib/risk";
import type { FileRisk, RiskCategory } from "@/types/api";

const RISK_LEVELS: (RiskCategory | "all")[] = ["all", "critical", "high", "medium", "low"];
const RISK_RANK: Record<RiskCategory, number> = { critical: 3, high: 2, medium: 1, low: 0 };
const PAGE_SIZES = [10, 25, 50, 100];

type SortKey = "file_path" | "risk" | "probability" | "churn" | "complexity" | "bug_fixes" | "devs";

function topFolder(path: string): string | null {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? null : path.slice(0, idx);
}

function extensionOf(path: string): string | null {
  const name = path.split("/").pop() ?? path;
  const idx = name.lastIndexOf(".");
  return idx <= 0 ? null : name.slice(idx + 1).toLowerCase();
}

function sortValue(f: FileRisk, key: SortKey): number | string {
  switch (key) {
    case "file_path":
      return f.file_path.toLowerCase();
    case "risk":
      return f.risk_prediction ? RISK_RANK[f.risk_prediction.risk_category] : -1;
    case "probability":
      return f.risk_prediction?.defect_probability ?? -1;
    case "churn":
      return f.churn;
    case "complexity":
      return f.cyclomatic_complexity;
    case "bug_fixes":
      return f.bug_fix_frequency;
    case "devs":
      return f.developer_count;
  }
}

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "file_path", label: "File" },
  { key: "risk", label: "Risk" },
  { key: "probability", label: "Predicted Risk", align: "right" },
  { key: "churn", label: "Churn", align: "right" },
  { key: "complexity", label: "Complexity", align: "right" },
  { key: "bug_fixes", label: "Bug Fixes", align: "right" },
  { key: "devs", label: "Developers", align: "right" },
];

const DEFAULTS = { search: "", folder: "all", fileType: "all", riskLevel: "all" as RiskCategory | "all", sortKey: "probability" as SortKey, sortDir: "desc" as "asc" | "desc", pageSize: 25 };

export function FileRiskExplorerPage() {
  const { repoId } = useParams();
  const id = Number(repoId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRisk = (searchParams.get("risk") as RiskCategory | null) ?? undefined;

  const [search, setSearch] = useState(DEFAULTS.search);
  const [folder, setFolder] = useState(DEFAULTS.folder);
  const [fileType, setFileType] = useState(DEFAULTS.fileType);
  const [riskLevel, setRiskLevel] = useState<RiskCategory | "all">(initialRisk ?? DEFAULTS.riskLevel);
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULTS.sortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(DEFAULTS.sortDir);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULTS.pageSize);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["files", id],
    queryFn: () => filesApi.list(id),
  });

  const folders = useMemo(() => {
    const set = new Set<string>();
    data?.files.forEach((f) => {
      const folder = topFolder(f.file_path);
      if (folder) set.add(folder);
    });
    return Array.from(set).sort();
  }, [data]);

  const extensions = useMemo(() => {
    const set = new Set<string>();
    data?.files.forEach((f) => {
      const ext = extensionOf(f.file_path);
      if (ext) set.add(ext);
    });
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let rows = data?.files ?? [];
    if (search) rows = rows.filter((f) => f.file_path.toLowerCase().includes(search.toLowerCase()));
    if (folder !== "all") rows = rows.filter((f) => topFolder(f.file_path) === folder);
    if (fileType !== "all") rows = rows.filter((f) => extensionOf(f.file_path) === fileType);
    if (riskLevel !== "all") rows = rows.filter((f) => f.risk_prediction?.risk_category === riskLevel);

    const sorted = [...rows].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [data, search, folder, fileType, riskLevel, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const filtersActive =
    search !== DEFAULTS.search ||
    folder !== DEFAULTS.folder ||
    fileType !== DEFAULTS.fileType ||
    riskLevel !== DEFAULTS.riskLevel ||
    sortKey !== DEFAULTS.sortKey ||
    sortDir !== DEFAULTS.sortDir ||
    pageSize !== DEFAULTS.pageSize;

  const resetFilters = () => {
    setSearch(DEFAULTS.search);
    setFolder(DEFAULTS.folder);
    setFileType(DEFAULTS.fileType);
    setRiskLevel(DEFAULTS.riskLevel);
    setSortKey(DEFAULTS.sortKey);
    setSortDir(DEFAULTS.sortDir);
    setPageSize(DEFAULTS.pageSize);
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const withFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <AppShell title="File Risk Explorer">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => withFilterChange(setSearch)(e.target.value)}
            placeholder="Search file path…"
            className="input-field pl-9"
          />
        </div>
        <select value={folder} onChange={(e) => withFilterChange(setFolder)(e.target.value)} className="input-field w-full sm:w-44">
          <option value="all">All folders</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select value={fileType} onChange={(e) => withFilterChange(setFileType)(e.target.value)} className="input-field w-full sm:w-36">
          <option value="all">All extensions</option>
          {extensions.map((ext) => (
            <option key={ext} value={ext}>
              .{ext}
            </option>
          ))}
        </select>
        <select
          value={riskLevel}
          onChange={(e) => withFilterChange(setRiskLevel)(e.target.value as RiskCategory | "all")}
          className="input-field w-full sm:w-40"
        >
          {RISK_LEVELS.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All risk levels" : `${r[0].toUpperCase()}${r.slice(1)} risk`}
            </option>
          ))}
        </select>
        <select
          value={pageSize}
          onChange={(e) => withFilterChange(setPageSize)(Number(e.target.value))}
          className="input-field w-full sm:w-32"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
        {filtersActive && (
          <button onClick={resetFilters} className="btn-secondary text-xs">
            <RotateCcw size={13} /> Reset Filters
          </button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : isError ? (
        <ErrorState description="Couldn't load the file list for this repository." onRetry={() => refetch()} />
      ) : !data || data.files.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="No analysis yet" description="Run an analysis on this repository to see file-level risk." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="No files match" description="Try adjusting your filters or search term." action={<button onClick={resetFilters} className="btn-secondary mt-2">Reset Filters</button>} />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-700/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className={`whitespace-nowrap px-3 py-3 font-medium first:pl-5 ${col.align === "right" ? "text-right" : ""}`}>
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 hover:text-slate-300 ${col.align === "right" ? "flex-row-reverse" : ""}`}
                      >
                        {col.label}
                        {sortKey === col.key && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-base-700/40">
                {paged.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => navigate(`/repos/${id}/files/${f.id}`)}
                    className="cursor-pointer transition-colors hover:bg-base-800/40"
                  >
                    <td className="max-w-xs truncate px-5 py-3 font-mono text-xs text-slate-200">{f.file_path}</td>
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} files
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-tabular">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
