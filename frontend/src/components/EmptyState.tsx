import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-base-800 text-slate-500">
        <Icon size={22} />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
      {action}
    </div>
  );
}
