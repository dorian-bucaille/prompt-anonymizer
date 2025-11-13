import React, { useEffect, useMemo, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { calculate } from "./lib/calc";
import type { Inputs, SplitMode } from "./lib/types";
import { InputField } from "./components/InputField";
import { SummaryCard } from "./components/SummaryCard";
import { CalculationInfoCard } from "./components/CalculationInfoCard";
import { DetailsCard, type DetailsCardHandle } from "./components/DetailsCard";
import { GlossaryButton } from "./components/GlossaryButton";
import { InfoIcon } from "./components/InfoIcon";
import { History, type HistoryHandle } from "./components/History";
import { loadState, saveState, type HistoryItem } from "./lib/storage";
import { useCollapse } from "./hooks/useCollapse";
import "./styles.css";
import { TextField } from "./components/TextField";

const DEFAULTS: Inputs = {
  partnerAName: "",
  partnerBName: "",
  a1: 2000,
  a2: 175,
  b2: 0,
  trPct: 100,
  b: 2000,
  m: 1500,
  advanced: false,
  E: 600,
  biasPts: 0,
  mode: "proportional",
};

function parseQuery(defaults: Inputs): Inputs {
  const u = new URL(window.location.href);
  const g = (k: keyof Inputs) => u.searchParams.get(String(k));
  const num = (v: string | null, d: number) => (v ? Number(v) : d);
  const modeParam = u.searchParams.get("mode");
  const mode: SplitMode =
    modeParam === "equal_leftover"
      ? "equal_leftover"
      : modeParam === "proportional"
        ? "proportional"
        : defaults.mode;
  return {
    partnerAName: (u.searchParams.get("nameA") ?? defaults.partnerAName) || "",
    partnerBName: (u.searchParams.get("nameB") ?? defaults.partnerBName) || "",
    a1: num(g("a1"), defaults.a1),
    a2: num(g("a2"), defaults.a2),
    b2: num(g("b2"), defaults.b2),
    trPct: num(g("trPct"), defaults.trPct),
    b: num(g("b"), defaults.b),
    m: num(g("m"), defaults.m),
    advanced: g("advanced") ? g("advanced") === "1" : defaults.advanced,
    E: num(g("E"), defaults.E),
    biasPts: num(g("biasPts"), defaults.biasPts),
    mode,
  };
}

function toQuery(i: Inputs) {
  const p = new URLSearchParams();
  p.set("nameA", i.partnerAName);
  p.set("nameB", i.partnerBName);
  p.set("a1", String(i.a1));
  p.set("a2", String(i.a2));
  p.set("b2", String(i.b2));
  p.set("trPct", String(i.trPct));
  p.set("b", String(i.b));
  p.set("m", String(i.m));
  p.set("advanced", i.advanced ? "1" : "0");
  p.set("E", String(i.E));
  p.set("biasPts", String(i.biasPts));
  p.set("mode", i.mode);
  return `${location.origin}${location.pathname}?${p.toString()}`;
}

export default function App() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-GB";
  const partnerPlaceholderA = t("parameters.partnerPlaceholder", { label: "A" });
  const partnerPlaceholderB = t("parameters.partnerPlaceholder", { label: "B" });
  const [inputs, setInputs] = useState<Inputs>(() => {
    const loaded = loadState(DEFAULTS);
    const merged = parseQuery(loaded);
    return merged;
  });
  const [lastLoadedInputs, setLastLoadedInputs] = useState<Inputs>(inputs);
  const [ariaMessage, setAriaMessage] = useState("");
  const [copyTooltip, setCopyTooltip] = useState<
    { message: string; tone: "success" | "error" } | null
  >(null);
  const copyTooltipTimeout = useRef<ReturnType<typeof setTimeout>>();
  const historyRef = useRef<HistoryHandle>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const detailsRef = useRef<DetailsCardHandle>(null);
  const biasHighlight = useHighlightOnChange(inputs.biasPts);
  const advancedRef = useCollapse(inputs.advanced);
  const isDirty = useMemo(
    () => !areInputsEqual(inputs, lastLoadedInputs),
    [inputs, lastLoadedInputs],
  );

  const partnerAName = inputs.partnerAName.trim() || partnerPlaceholderA;
  const partnerBName = inputs.partnerBName.trim() || partnerPlaceholderB;
  const biasDisabled = inputs.mode === "equal_leftover";
  const advancedCollapsed = !inputs.advanced;
  const suffixEuroMonth = t("parameters.suffix.euroMonth");
  const suffixPercent = t("parameters.suffix.percent");

  const labelWithCode = (key: string, code: string, name?: string) => {
    const base = t(key, name ? { name } : undefined);
    return inputs.advanced ? `${base}${t("parameters.codeSuffix", { code })}` : base;
  };

  const salaryLabelA = labelWithCode("parameters.salaryLabel", "a1", partnerAName);
  const salaryLabelB = labelWithCode("parameters.salaryLabel", "b", partnerBName);
  const ticketsLabelA = labelWithCode("parameters.ticketsLabel", "a2", partnerAName);
  const ticketsLabelB = labelWithCode("parameters.ticketsLabel", "b2", partnerBName);
  const sharedBudgetLabel = labelWithCode("parameters.sharedBudgetLabel", "m");
  const salaryTooltipA = t("parameters.salaryTooltip", { name: partnerAName });
  const salaryTooltipB = t("parameters.salaryTooltip", { name: partnerBName });
  const ticketsTooltipA = t("parameters.ticketsTooltip", { name: partnerAName });
  const ticketsTooltipB = t("parameters.ticketsTooltip", { name: partnerBName });
  const sharedBudgetTooltip = t("parameters.sharedBudgetTooltip");

  useEffect(() => {
    saveState(inputs);
  }, [inputs]);

  const result = useMemo(() => calculate(inputs), [inputs]);

  useEffect(() => {
    return () => {
      if (copyTooltipTimeout.current) {
        clearTimeout(copyTooltipTimeout.current);
      }
    };
  }, []);

  const copyLink = async () => {
    const url = toQuery(inputs);
    try {
      await navigator.clipboard.writeText(url);
      const message = t("actions.copyLinkSuccess");
      setAriaMessage(message);
      setCopyTooltip({ message, tone: "success" });
    } catch {
      const message = "Impossible de copier le lien automatiquement.";
      setAriaMessage(message);
      setCopyTooltip({ message, tone: "error" });
    }

    if (copyTooltipTimeout.current) {
      clearTimeout(copyTooltipTimeout.current);
    }

    copyTooltipTimeout.current = setTimeout(() => {
      setCopyTooltip(null);
    }, 2400);
  };

  const reset = () => {
    const fresh = { ...DEFAULTS };
    setInputs(fresh);
    setLastLoadedInputs(fresh);
  };

  const printPDF = () => window.print();

  const handleModeChange = (mode: SplitMode) => {
    setInputs((prev) => ({ ...prev, mode }));
    setAriaMessage(
      mode === "equal_leftover"
        ? t("accessibility.modeEqualLeftover")
        : t("accessibility.modeProportional"),
    );
  };

  const handleSummarySave = () => {
    historyRef.current?.addCurrentState();
  };

  const handleSummaryFocusNote = () => {
    historyRef.current?.focusNote();
  };

  const handleHistoryCleared = () => {
    setAriaMessage(t("accessibility.historyCleared"));
  };

  const handleLoadHistory = (item: HistoryItem) => {
    if (isDirty) {
      const confirmed = window.confirm(t("actions.confirmLoad"));
      if (!confirmed) return;
    }

    const snapshot = JSON.parse(JSON.stringify(item.inputs)) as Inputs;
    setInputs(snapshot);
    setLastLoadedInputs(snapshot);

    const formattedDate = new Date(item.dateISO).toLocaleDateString(locale);
    setAriaMessage(t("accessibility.historyLoaded", { date: formattedDate }));

    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      titleRef.current?.focus();
    }, 300);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-rose-50 transition-colors duration-300 ease-out dark:from-gray-950 dark:via-gray-950 dark:to-slate-900">
      <div className="pointer-events-none absolute -left-32 top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-rose-300/30 blur-3xl dark:bg-rose-500/20" />
      <div className="pointer-events-none absolute bottom-[-14rem] right-[-24rem] h-[32rem] w-[32rem] rounded-full bg-sky-300/25 blur-3xl dark:bg-sky-500/20" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/70 bg-white/80 px-6 py-6 shadow-xl backdrop-blur-md transition-colors duration-300 ease-out dark:border-white/10 dark:bg-gray-900/60">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2 text-center md:text-left">
              <h1
                className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50"
                ref={titleRef}
                tabIndex={-1}
              >
                {t("header.title")}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t("header.description")}</p>
            </div>
            <div className="no-print flex flex-col items-center gap-3 md:items-end">
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
                {inputs.advanced && <GlossaryButton />}
              </div>
              <div className="flex flex-wrap justify-center gap-2 md:justify-end">
                <a
                  href="https://github.com/dorian-bucaille/equilibre-couple"
                  className="btn btn-ghost"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("header.github")}
                </a>
                <div className="relative">
                  <button onClick={copyLink} className="btn btn-ghost">
                    {t("actions.copyLink")}
                  </button>
                  {copyTooltip ? (
                    <div className="pointer-events-none absolute inset-x-0 top-full mt-2 flex justify-center">
                      <span
                        role="status"
                        className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium shadow-lg ring-1 ring-black/5 ${copyTooltip.tone === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}
                      >
                        {copyTooltip.message}
                      </span>
                    </div>
                  ) : null}
                </div>
                <button onClick={printPDF} className="btn btn-ghost">
                  {t("actions.print")}
                </button>
                <button onClick={reset} className="btn btn-danger">
                  {t("actions.reset")}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div aria-live="polite" className="sr-only">
          {ariaMessage}
        </div>

        <div className="mt-10 flex flex-col gap-10">
          <section className="card space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("parameters.title")}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("parameters.description")}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <TextField
                id="partnerAName"
                label={t("parameters.partnerNameLabel", { label: "A" })}
                value={inputs.partnerAName}
                onChange={(value) => setInputs({ ...inputs, partnerAName: value })}
                placeholder={partnerPlaceholderA}
                tooltip={t("parameters.partnerTooltip", { label: "A" })}
              />
              <TextField
                id="partnerBName"
                label={t("parameters.partnerNameLabel", { label: "B" })}
                value={inputs.partnerBName}
                onChange={(value) => setInputs({ ...inputs, partnerBName: value })}
                placeholder={partnerPlaceholderB}
                tooltip={t("parameters.partnerTooltip", { label: "B" })}
              />
              <fieldset className="space-y-3 sm:col-span-2" aria-describedby="mode-tip">
                <legend className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <span>{t("parameters.modeLabel")}</span>
                  <InfoIcon title={t("parameters.modeTooltip")} tooltipId="mode-tip" />
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="mode-option">
                    <input
                      type="radio"
                      name="mode"
                      value="proportional"
                      checked={inputs.mode === "proportional"}
                      onChange={() => handleModeChange("proportional")}
                      className="mode-option__input"
                    />
                    <div className="mode-option__content">
                      <span className="mode-option__title">{t("parameters.modes.proportional.title")}</span>
                      <span className="mode-option__description">
                        {t("parameters.modes.proportional.description")}
                      </span>
                    </div>
                  </label>
                  <label className="mode-option">
                    <input
                      type="radio"
                      name="mode"
                      value="equal_leftover"
                      checked={inputs.mode === "equal_leftover"}
                      onChange={() => handleModeChange("equal_leftover")}
                      className="mode-option__input"
                    />
                    <div className="mode-option__content">
                      <span className="mode-option__title">{t("parameters.modes.equal_leftover.title")}</span>
                      <span className="mode-option__description">
                        {t("parameters.modes.equal_leftover.description")}
                      </span>
                    </div>
                  </label>
                </div>
              </fieldset>
              <InputField
                id="a1"
                label={salaryLabelA}
                value={inputs.a1}
                onChange={(v) => setInputs({ ...inputs, a1: v })}
                suffix={suffixEuroMonth}
                tooltip={salaryTooltipA}
              />
              <InputField
                id="b"
                label={salaryLabelB}
                value={inputs.b}
                onChange={(v) => setInputs({ ...inputs, b: v })}
                suffix={suffixEuroMonth}
                tooltip={salaryTooltipB}
              />
              <InputField
                id="a2"
                label={ticketsLabelA}
                value={inputs.a2}
                onChange={(v) => setInputs({ ...inputs, a2: v })}
                suffix={suffixEuroMonth}
                tooltip={ticketsTooltipA}
              />
              <InputField
                id="b2"
                label={ticketsLabelB}
                value={inputs.b2}
                onChange={(v) => setInputs({ ...inputs, b2: v })}
                suffix={suffixEuroMonth}
                tooltip={ticketsTooltipB}
              />
              <InputField
                id="m"
                label={sharedBudgetLabel}
                value={inputs.m}
                onChange={(v) => setInputs({ ...inputs, m: v })}
                suffix={suffixEuroMonth}
                tooltip={sharedBudgetTooltip}
              />
              <div className="sm:col-span-2">
                <div className="rounded-3xl border border-dashed border-rose-200/80 bg-white/70 p-4 shadow-sm transition-colors duration-300 ease-out dark:border-rose-500/40 dark:bg-gray-900/40">
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 ease-out ${
                      inputs.advanced
                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-200"
                        : "bg-white/60 text-gray-700 hover:bg-white dark:bg-gray-900/40 dark:text-gray-200 dark:hover:bg-gray-900/60"
                    }`}
                    onClick={() => setInputs({ ...inputs, advanced: !inputs.advanced })}
                    aria-expanded={inputs.advanced}
                    aria-controls="advanced-panel"
                  >
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-sm font-semibold">{t("parameters.advancedToggle.title")}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t("parameters.advancedToggle.description")}
                      </span>
                    </div>
                    <span
                      className={`text-lg transition-transform duration-300 ease-out ${
                        inputs.advanced ? "rotate-180" : "rotate-0"
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t("parameters.advancedToggle.helper")}</p>
                  <div
                    id="advanced-panel"
                    ref={advancedRef}
                    className="overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out"
                    style={{ maxHeight: "0px", opacity: 0, transform: "translateY(-0.5rem)" }}
                    aria-hidden={advancedCollapsed}
                  >
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <InputField
                        id="trPct"
                        label={t("parameters.trPctLabel")}
                        value={inputs.trPct}
                        onChange={(v) => setInputs({ ...inputs, trPct: v })}
                        suffix={suffixPercent}
                        min={0}
                        max={100}
                        step={1}
                        tooltip={t("parameters.trPctTooltip")}
                        disabled={advancedCollapsed}
                      />
                      <InputField
                        id="E"
                        label={t("parameters.eligibleLabel")}
                        value={inputs.E}
                        onChange={(v) => setInputs({ ...inputs, E: v })}
                        suffix={suffixEuroMonth}
                        tooltip={t("parameters.eligibleTooltip")}
                        disabled={advancedCollapsed}
                      />
                      <label className="flex flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white/70 p-4 shadow-sm transition-colors duration-300 ease-out dark:border-gray-700/60 dark:bg-gray-900/40 sm:col-span-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {t("parameters.bias.label", { partnerA: partnerAName, partnerB: partnerBName })}
                          </span>
                          <div className="flex flex-col items-start gap-1 text-xs font-medium text-gray-500 sm:items-end sm:text-right dark:text-gray-400">
                            <span
                              className={`transition-all duration-200 ease-out ${
                                biasHighlight
                                  ? "-translate-y-0.5 text-rose-600 opacity-100 dark:text-rose-300"
                                  : "translate-y-0 text-gray-500 opacity-80 dark:text-gray-400"
                              }`}
                            >
                              {formatBiasSummary(inputs.biasPts, partnerAName, partnerBName, t)}
                            </span>
                            <span
                              className={`transition-all duration-200 ease-out ${
                                biasHighlight
                                  ? "text-rose-600 opacity-100 dark:text-rose-300"
                                  : "text-gray-500 opacity-80 dark:text-gray-400"
                              }`}
                            >
                              {formatBiasForPartner(inputs.biasPts, partnerAName, t)}
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={-10}
                          max={10}
                          step={0.5}
                          value={inputs.biasPts}
                          onChange={(e) =>
                            setInputs({ ...inputs, biasPts: parseFloat(e.target.value) })
                          }
                          aria-label={t("parameters.bias.sliderLabel", { partnerA: partnerAName, partnerB: partnerBName })}
                          className={`w-full accent-rose-500 transition-transform duration-200 ease-out ${
                            biasHighlight ? "scale-[1.01]" : "scale-100"
                          }`}
                          disabled={advancedCollapsed || biasDisabled}
                        />
                        <div className="flex justify-between text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          <span>{t("parameters.bias.favorA", { name: partnerAName })}</span>
                          <span>{t("parameters.bias.neutral")}</span>
                          <span>{t("parameters.bias.favorB", { name: partnerBName })}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t("parameters.bias.helper", { partnerA: partnerAName, partnerB: partnerBName })}
                        </span>
                        {biasDisabled && (
                          <span className="field-help text-amber-600 dark:text-amber-400">
                            {t("parameters.bias.disabled")}
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <SummaryCard
            r={result}
            partnerAName={partnerAName}
            partnerBName={partnerBName}
            mode={inputs.mode}
            onSaveHistory={handleSummarySave}
            onFocusNote={handleSummaryFocusNote}
          />
          <CalculationInfoCard
            onRequestDetails={() => {
              detailsRef.current?.openAndFocus();
            }}
          />
          <DetailsCard ref={detailsRef} r={result} />

          {result.warnings.length > 0 && (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-50/80 p-5 text-sm text-amber-800 shadow-sm dark:border-amber-400/40 dark:bg-amber-900/30 dark:text-amber-200">
              <ul className="ml-4 list-disc space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <History
            ref={historyRef}
            inputs={inputs}
            result={result}
            onLoad={handleLoadHistory}
            onRequestClearAll={handleHistoryCleared}
          />
        </div>
      </div>
    </div>
  );
}

function areInputsEqual(a: Inputs, b: Inputs) {
  const keys: (keyof Inputs)[] = [
    "partnerAName",
    "partnerBName",
    "a1",
    "a2",
    "b2",
    "trPct",
    "b",
    "m",
    "advanced",
    "E",
    "biasPts",
    "mode",
  ];

  return keys.every((key) => a[key] === b[key]);
}

function ThemeToggle() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(
    () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return (
    <button
      className="btn btn-ghost transition-transform duration-300 ease-out hover:scale-105 active:scale-95"
      onClick={() => setDark((d) => !d)}
      aria-pressed={dark}
      aria-label={t("accessibility.toggleDarkMode")}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = i18n.language.startsWith("fr") ? "fr" : "en";

  return (
    <div className="relative">
      <label htmlFor="language-select" className="sr-only">
        {t("accessibility.languageSwitcher")}
      </label>
      <select
        id="language-select"
        className="input w-28 cursor-pointer appearance-none pr-8 text-sm"
        value={current}
        onChange={(event) => {
          const next = event.target.value;
          void i18n.changeLanguage(next);
        }}
      >
        <option value="fr">{t("languages.fr")}</option>
        <option value="en">{t("languages.en")}</option>
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500">▾</span>
    </div>
  );
}

function useHighlightOnChange(value: number, duration = 250) {
  const [highlight, setHighlight] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setHighlight(true);
    const timeout = window.setTimeout(() => setHighlight(false), duration);
    return () => window.clearTimeout(timeout);
  }, [value, duration]);

  return highlight;
}

function formatBiasSummary(
  value: number,
  partnerAName: string,
  partnerBName: string,
  t: TFunction,
) {
  const normalized = Math.abs(value) < 1e-6 ? 0 : value;
  if (normalized === 0) return t("parameters.bias.summaryNeutral");
  const points = `${normalized > 0 ? "+" : ""}${normalized.toFixed(1)}`;
  if (normalized > 0) {
    return t("parameters.bias.summaryFavor", { name: partnerBName, points });
  }
  return t("parameters.bias.summaryFavor", { name: partnerAName, points });
}

function formatBiasForPartner(value: number, partnerName: string, t: TFunction) {
  const normalized = Math.abs(value) < 1e-6 ? 0 : value;
  const sign = normalized > 0 ? "+" : normalized < 0 ? "" : "+";
  return t("parameters.bias.summaryDetail", {
    name: partnerName,
    points: `${sign}${normalized.toFixed(1)}`,
  });
}
