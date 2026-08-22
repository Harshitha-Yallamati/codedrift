import { useNavigate, useParams } from "react-router-dom";
import type { FileRisk } from "@/types/api";
import { RISK_COLORS } from "@/lib/risk";

export function RiskHeatmap({ files }: { files: FileRisk[] }) {
  const navigate = useNavigate();
  const { repoId } = useParams();
  const scored = files.filter((f) => f.risk_prediction);
  const sorted = [...scored].sort((a, b) => (b.risk_prediction!.defect_probability - a.risk_prediction!.defect_probability));

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Risk Heatmap</h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {(["low", "medium", "high", "critical"] as const).map((cat) => (
            <span key={cat} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: RISK_COLORS[cat] }} />
              {cat}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(28px,1fr))] gap-1">
        {sorted.map((f) => {
          const prob = f.risk_prediction!.defect_probability;
          const color = RISK_COLORS[f.risk_prediction!.risk_category];
          return (
            <button
              key={f.id}
              title={`${f.file_path} — ${(prob * 100).toFixed(0)}%`}
              onClick={() => navigate(`/repos/${repoId}/files/${f.id}`)}
              className="aspect-square rounded-[3px] transition-transform hover:scale-125 hover:z-10 relative"
              style={{ backgroundColor: color, opacity: 0.35 + prob * 0.65 }}
            />
          );
        })}
      </div>
      {sorted.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No scored files yet.</p>}
    </div>
  );
}
