import { healthScoreColor } from "@/lib/risk";

export function HealthScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  const color = healthScoreColor(clamped);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={10} fill="none" className="text-base-700" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold font-tabular" style={{ color }}>
          {clamped.toFixed(0)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Health</span>
      </div>
    </div>
  );
}
