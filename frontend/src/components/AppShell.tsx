import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base-950">
      <Sidebar />
      <div className="flex-1 min-w-0">
        {title && (
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-base-700/60 bg-base-950/80 px-6 py-4 backdrop-blur-md">
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            <div className="flex items-center gap-2">{actions}</div>
          </header>
        )}
        <main className="mx-auto max-w-7xl px-6 py-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
