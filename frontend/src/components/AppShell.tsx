import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar, SidebarLogo, SidebarNavContent } from "@/components/Sidebar";

export function AppShell({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base-950">
      <Sidebar />

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-base-950 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pr-3">
              <SidebarLogo />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-base-800 hover:text-slate-200"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarNavContent onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-10 bg-base-950/80 backdrop-blur-md">
          {/* Mobile top bar */}
          <div className="flex items-center gap-3 border-b border-base-700/60 px-4 py-3 md:hidden">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-base-800 hover:text-slate-200"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-[15px] font-bold tracking-tight text-white">CodeDrift</span>
          </div>

          {title && (
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-base-700/60 px-4 py-4 sm:px-6">
              <h1 className="text-lg font-semibold text-white">{title}</h1>
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            </header>
          )}
        </div>
        <main className="mx-auto max-w-7xl px-4 py-6 animate-fade-in sm:px-6">{children}</main>
      </div>
    </div>
  );
}
