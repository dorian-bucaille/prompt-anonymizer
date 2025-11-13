import type { ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function CollapsibleSection({ title, subtitle, isOpen, onToggle, children }: CollapsibleSectionProps) {
  const panelId = `panel-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className="card">
      <button
        type="button"
        className="flex w-full items-center gap-4 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/80 bg-white/60 text-gray-600 transition dark:border-gray-700/60 dark:bg-gray-900/60 dark:text-gray-300 ${isOpen ? "rotate-0" : "-rotate-90"}`}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div id={panelId} className="mt-6">
          {children}
        </div>
      )}
    </section>
  );
}
