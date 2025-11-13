import React, { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type CalculationInfoCardProps = {
  onRequestDetails: () => void;
};

const STORAGE_KEY = "calc-info-open";

export const CalculationInfoCard: React.FC<CalculationInfoCardProps> = ({ onRequestDetails }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setOpen(saved === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, open ? "true" : "false");
  }, [open]);

  useEffect(() => {
    if (open && shouldFocusRef.current) {
      window.setTimeout(() => {
        titleRef.current?.focus();
        shouldFocusRef.current = false;
      }, 80);
    }
  }, [open]);

  const toggle = () => {
    if (!open) {
      shouldFocusRef.current = true;
    }
    setOpen((prev) => !prev);
  };

  return (
    <section
      className="card border-blue-200/70 bg-blue-50/70 shadow-sm dark:border-blue-500/30 dark:bg-slate-900/40"
      aria-label={t("calculationInfo.aria")}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-md border border-transparent bg-white/60 px-3 py-2 text-left text-sm font-medium text-blue-700 transition-colors duration-200 ease-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:bg-slate-900/70 dark:text-blue-200 dark:hover:bg-slate-900"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className="flex items-center gap-2 text-base font-semibold">
          <span aria-hidden="true">🧠</span>
          {t("calculationInfo.toggle")}
        </span>
        <span aria-hidden="true" className={`text-lg transition-transform duration-300 ease-out ${open ? "-rotate-180" : "rotate-0"}`}>
          ▾
        </span>
      </button>

      <div
        id={contentId}
        className={`mt-4 overflow-hidden text-sm transition-[max-height,opacity,transform] duration-300 ease-out ${
          open ? "max-h-[2000px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2"
        }`}
        aria-hidden={!open}
      >
        <div className="space-y-5">
          <h3
            ref={titleRef}
            tabIndex={-1}
            className="text-lg font-semibold text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:text-blue-200"
          >
            {t("calculationInfo.sectionTitle")}
          </h3>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-200">{t("calculationInfo.objectiveTitle")}</h4>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">{t("calculationInfo.objectiveText")}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-200">{t("calculationInfo.modelsTitle")}</h4>
            <div className="space-y-3">
              <div className="rounded-md border border-blue-200/60 bg-white/70 p-3 text-gray-700 shadow-sm dark:border-blue-500/30 dark:bg-slate-900/60 dark:text-gray-100">
                <p className="font-semibold text-gray-900 dark:text-gray-50">{t("calculationInfo.proportionalTitle")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {(t("calculationInfo.proportionalList") as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-blue-200/60 bg-white/70 p-3 text-gray-700 shadow-sm dark:border-blue-500/30 dark:bg-slate-900/60 dark:text-gray-100">
                <p className="font-semibold text-gray-900 dark:text-gray-50">{t("calculationInfo.equalTitle")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {(t("calculationInfo.equalList") as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-200">{t("calculationInfo.trTitle")}</h4>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">{t("calculationInfo.trText")}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-200">{t("calculationInfo.biasTitle")}</h4>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">{t("calculationInfo.biasText")}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-200">{t("calculationInfo.limitsTitle")}</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                {(t("calculationInfo.limitsList") as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {open && (
            <div>
              <a
                href="#details-section"
                className="text-sm font-medium text-blue-700 underline underline-offset-2 transition-colors hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                onClick={(event) => {
                  event.preventDefault();
                  onRequestDetails();
                }}
              >
                {t("calculationInfo.detailsLink")}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

