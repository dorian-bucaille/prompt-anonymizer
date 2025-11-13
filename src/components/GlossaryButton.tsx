import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export const GlossaryButton: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const definitions = t("glossary.terms") as Array<{ term: string; description: string }>;

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="glossary-panel"
        aria-label={t("glossary.title")}
      >
        ?
      </button>
      {open && (
        <div
          id="glossary-panel"
          role="dialog"
          aria-label={t("glossary.aria")}
          className="absolute right-0 z-20 mt-2 w-72 max-w-xs rounded-lg border border-gray-200 bg-white p-4 text-left text-sm shadow-lg dark:border-gray-700 dark:bg-slate-900"
        >
          <h3 className="mb-2 text-base font-semibold">{t("glossary.title")}</h3>
          <dl className="space-y-2">
            {definitions.map((item) => (
              <div key={item.term}>
                <dt className="font-medium text-gray-900 dark:text-gray-100">{item.term}</dt>
                <dd className="text-gray-600 dark:text-gray-300">{item.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
};

