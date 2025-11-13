import { calculate } from "./calc";
import i18n from "./i18n";
import type { Inputs } from "./types";

const KEY_STATE = "eqc_state_v1";
const KEY_HISTORY = "eqc_history_v2";

export function saveState(state: Inputs) {
  localStorage.setItem(KEY_STATE, JSON.stringify(state));
}

export function loadState(defaults: Inputs): Inputs {
  const raw = localStorage.getItem(KEY_STATE);
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export type HistoryResultSnapshot = {
  depositA: number;
  depositB: number;
  cashNeeded: number;
  usedTR: number;
  partnerAName: string;
  partnerBName: string;
};

export type HistoryItem = {
  id: string;
  dateISO: string;
  note: string;
  inputs: Inputs;
  result: HistoryResultSnapshot;
};

type LegacyHistoryItem = {
  id: string;
  dateISO: string;
  note: string;
  inputs: Inputs;
  result?: HistoryResultSnapshot;
};

const LEGACY_KEYS = ["eqc_history_v1"] as const;

function upgradeHistoryItem(item: LegacyHistoryItem): HistoryItem {
  if (item.result) return item as HistoryItem;

  const computed = calculate(item.inputs);
  const partnerAName =
    item.inputs.partnerAName?.trim() || i18n.t("parameters.partnerPlaceholder", { label: "A" });
  const partnerBName =
    item.inputs.partnerBName?.trim() || i18n.t("parameters.partnerPlaceholder", { label: "B" });

  return {
    ...item,
    result: {
      depositA: computed.depositD,
      depositB: computed.depositM,
      cashNeeded: computed.cashNeeded,
      usedTR: computed.V,
      partnerAName,
      partnerBName,
    },
  };
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw) as LegacyHistoryItem[];
      return parsed.map(upgradeHistoryItem);
    }

    for (const legacyKey of LEGACY_KEYS) {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (!legacyRaw) continue;
      const parsed = JSON.parse(legacyRaw) as LegacyHistoryItem[];
      const upgraded = parsed.map(upgradeHistoryItem);
      saveHistory(upgraded);
      localStorage.removeItem(legacyKey);
      return upgraded;
    }

    return [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(KEY_HISTORY, JSON.stringify(items));
}
