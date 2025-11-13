import { clamp /*, round2 */ } from "./format"; // ⟵ on n'utilise plus round2 ici
import i18n from "./i18n";
import type { Inputs, Result, SplitMode } from "./types";

// Arrondi sûr à 2 décimales (toujours un number, jamais NaN)
const r2 = (n: unknown): number => {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.round(x * 100) / 100;
};

export function calculate(inputs: Inputs): Result {
  const toFinite = (value: unknown, fallback = 0) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;

  const a1 = toFinite(inputs.a1);
  const a2 = toFinite(inputs.a2);
  const b2 = toFinite(inputs.b2);
  const trPct = toFinite(inputs.trPct, 100);
  const b = toFinite(inputs.b);
  const m = toFinite(inputs.m);
  const advanced = Boolean(inputs.advanced);
  const E = toFinite(inputs.E);
  const requestedMode = inputs.mode as SplitMode | undefined;
  const mode: SplitMode = requestedMode === "equal_leftover" ? "equal_leftover" : "proportional";
  const biasPtsRaw = toFinite(inputs.biasPts);
  const biasPts = mode === "equal_leftover" ? 0 : biasPtsRaw;
  const partnerAName = inputs.partnerAName?.trim() || i18n.t("parameters.partnerPlaceholder", { label: "A" });
  const partnerBName = inputs.partnerBName?.trim() || i18n.t("parameters.partnerPlaceholder", { label: "B" });

  const trPctClamped = clamp(trPct, 0, 100) / 100;
  const effectiveTRA = Math.max(0, a2) * trPctClamped;
  const effectiveTRB = Math.max(0, b2) * trPctClamped;
  const effectiveTR = effectiveTRA + effectiveTRB;

  const eligibleTR = Math.max(0, E);

  let usedTRA = effectiveTRA;
  let usedTRB = effectiveTRB;

  if (advanced) {
    const cap = Math.min(effectiveTR, eligibleTR);
    if (effectiveTR > 0 && cap < effectiveTR) {
      const ratio = cap / effectiveTR;
      usedTRA = effectiveTRA * ratio;
      usedTRB = effectiveTRB * ratio;
    }
    if (cap === 0) {
      usedTRA = 0;
      usedTRB = 0;
    }
  }

  const V = advanced ? usedTRA + usedTRB : effectiveTR;

  const potTotal = advanced ? m + eligibleTR : m + V;

  const extraEligibleCash = advanced ? Math.max(0, eligibleTR - V) : 0;

  const cashNeeded = m + extraEligibleCash;

  const cashNeededRounded = r2(cashNeeded);
  const SA = Math.max(0, a1);
  const SB = Math.max(0, b);

  let shareD_raw = 0.5;
  let shareD_biased = 0.5;
  let shareM_biased = 0.5;
  let contribEqDRaw = 0;
  let contribEqMRaw = 0;
  let depositD = 0;
  let depositM = 0;
  let leftoverA = 0;
  let leftoverB = 0;

  const warnings: string[] = [];
  const steps: string[] = [];

  const pushCommonSteps = () => {
    steps.push(
      i18n.t("calc.steps.effectiveTr", {
        partnerAName,
        partnerBName,
        valueA: r2(effectiveTRA),
        valueB: r2(effectiveTRB),
        total: r2(effectiveTR),
      }),
    );
    steps.push(
      advanced
        ? i18n.t("calc.steps.usedTrCapped", {
            partnerAName,
            partnerBName,
            valueA: r2(usedTRA),
            valueB: r2(usedTRB),
            total: r2(V),
          })
        : i18n.t("calc.steps.usedTr", {
            partnerAName,
            partnerBName,
            valueA: r2(effectiveTRA),
            valueB: r2(effectiveTRB),
            total: r2(V),
          }),
    );
    steps.push(
      advanced
        ? i18n.t("calc.steps.totalPotAdvanced", {
            m: r2(m),
            eligible: r2(eligibleTR),
            total: r2(potTotal),
          })
        : i18n.t("calc.steps.totalPot", {
            m: r2(m),
            v: r2(V),
            total: r2(potTotal),
          }),
    );
    const extra = r2(Math.max(0, eligibleTR - V));
    steps.push(
      advanced
        ? i18n.t("calc.steps.cashNeededAdvanced", {
            m: r2(m),
            extra,
            cash: r2(cashNeededRounded),
          })
        : i18n.t("calc.steps.cashNeeded", {
            cash: r2(cashNeededRounded),
          }),
    );
  };

  pushCommonSteps();

  if (mode === "proportional") {
    const wD = SA + usedTRA;
    const wM = SB + usedTRB;
    const denom = wD + wM;
    shareD_raw = denom > 0 ? wD / denom : 0.5;

    // Biais signé : +X => favorise B (A paie plus), -X => favorise A (A paie moins)
    const biasShift = clamp(biasPts, -50, 50) / 100;
    shareD_biased = clamp(shareD_raw + biasShift, 0, 1);
    shareM_biased = 1 - shareD_biased;

    contribEqDRaw = potTotal * shareD_biased;
    contribEqMRaw = potTotal - contribEqDRaw;

    let depositDRaw = contribEqDRaw - usedTRA;
    let depositMRaw = contribEqMRaw - usedTRB;

    if (depositDRaw < 0) {
      depositMRaw += depositDRaw;
      depositDRaw = 0;
    }
    if (depositMRaw < 0) {
      depositDRaw += depositMRaw;
      depositMRaw = 0;
    }

    depositD = r2(Math.max(0, depositDRaw));
    depositM = r2(Math.max(0, cashNeededRounded - depositD));

    const sumDeposits = depositD + depositM;
    if (sumDeposits > cashNeededRounded && Math.abs(sumDeposits - cashNeededRounded) < 0.05) {
      const diff = r2(sumDeposits - cashNeededRounded);
      if (diff > 0) {
        if (depositM >= diff) depositM = r2(depositM - diff);
        else depositD = r2(Math.max(0, depositD - diff));
      }
    }

    // Sécurité borne (arrondis)
    depositD = r2(depositD);
    depositM = r2(depositM);
    if (depositM < 0 && Math.abs(depositM) < 0.02) {
      depositM = 0;
      depositD = r2(cashNeededRounded - depositM);
    }
    if (depositD < 0 && Math.abs(depositD) < 0.02) {
      depositD = 0;
      depositM = r2(cashNeededRounded);
    }

    leftoverA = r2(SA - depositD);
    leftoverB = r2(SB - depositM);

    if (denom === 0) {
      warnings.push(i18n.t("calc.warnings.zeroWeighted"));
    }
    if (contribEqDRaw - usedTRA < 0) {
      warnings.push(i18n.t("calc.warnings.depositBoundedA", { name: partnerAName }));
    }
    if (contribEqMRaw - usedTRB < 0) {
      warnings.push(i18n.t("calc.warnings.depositBoundedB", { name: partnerBName }));
    }

    const shareA = (shareD_raw * 100).toFixed(1);
    const shareB = ((1 - shareD_raw) * 100).toFixed(1);
    const biasedShareA = (shareD_biased * 100).toFixed(1);
    const biasedShareB = (shareM_biased * 100).toFixed(1);
    const biasDisplay = `${biasPts >= 0 ? "+" : ""}${biasPts.toFixed(1)}`;
    const biasDirection =
      biasPts === 0
        ? i18n.t("calc.steps.biasDirection.neutral")
        : biasPts > 0
          ? i18n.t("calc.steps.biasDirection.favorB", { name: partnerBName })
          : i18n.t("calc.steps.biasDirection.favorA", { name: partnerAName });

    steps.push(
      i18n.t("calc.steps.sharesRaw", {
        partnerAName,
        partnerBName,
        shareA,
        shareB,
      }),
    );
    steps.push(
      i18n.t("calc.steps.bias", {
        bias: biasDisplay,
        direction: biasDirection,
        partnerAName,
        partnerBName,
        shareA: biasedShareA,
        shareB: biasedShareB,
      }),
    );
    steps.push(
      i18n.t("calc.steps.contributionEquivalent", {
        partnerAName,
        partnerBName,
        valueA: r2(contribEqDRaw),
        valueB: r2(contribEqMRaw),
      }),
    );
    steps.push(
      i18n.t("calc.steps.cashDeposits", {
        partnerAName,
        partnerBName,
        valueA: r2(depositD),
        valueB: r2(depositM),
        total: r2(depositD + depositM),
      }),
    );
  } else {
    let depositDRaw = (cashNeeded + (SA - SB)) / 2;
    let depositMRaw = cashNeeded - depositDRaw;
    let boundedA = false;
    let boundedB = false;

    if (depositDRaw < 0) {
      depositDRaw = 0;
      depositMRaw = cashNeeded;
      boundedA = true;
    }
    if (depositMRaw < 0) {
      depositMRaw = 0;
      depositDRaw = cashNeeded;
      boundedB = true;
    }

    depositD = r2(Math.max(0, depositDRaw));
    depositM = r2(Math.max(0, cashNeededRounded - depositD));

    if (depositM < 0 && Math.abs(depositM) < 0.02) {
      depositM = 0;
      depositD = r2(cashNeededRounded);
    }
    if (depositD < 0 && Math.abs(depositD) < 0.02) {
      depositD = 0;
      depositM = r2(cashNeededRounded);
    }

    leftoverA = r2(SA - depositD);
    leftoverB = r2(SB - depositM);

    contribEqDRaw = depositD + usedTRA;
    contribEqMRaw = depositM + usedTRB;
    shareD_raw = potTotal > 0 ? contribEqDRaw / potTotal : 0.5;
    shareD_raw = clamp(shareD_raw, 0, 1);
    shareD_biased = shareD_raw;
    shareM_biased = 1 - shareD_biased;

    if (depositD === 0 && SA < SB) {
      warnings.push(i18n.t("calc.warnings.equalBoundedA"));
    }
    if (depositM === 0 && SB < SA) {
      warnings.push(i18n.t("calc.warnings.equalBoundedB"));
    }

    steps.push(i18n.t("calc.steps.equalModeIntro"));
    steps.push(
      i18n.t("calc.steps.equalEquation", {
        sa: r2(SA),
        sb: r2(SB),
        partnerAName,
        partnerBName,
      }),
    );
    steps.push(
      i18n.t("calc.steps.equalDepositA", {
        partnerAName,
        sa: r2(SA),
        sb: r2(SB),
        depositA: r2(depositD),
      }),
    );
    steps.push(
      i18n.t("calc.steps.equalDepositB", {
        partnerAName,
        partnerBName,
        cashNeeded: r2(cashNeededRounded),
        depositA: r2(depositD),
        depositB: r2(depositM),
      }),
    );
    if (boundedA) {
      steps.push(i18n.t("calc.steps.equalBoundedA", { partnerAName }));
    }
    if (boundedB) {
      steps.push(i18n.t("calc.steps.equalBoundedB", { partnerBName }));
    }
    steps.push(
      i18n.t("calc.steps.contributionEqual", {
        partnerAName,
        partnerBName,
        valueA: r2(contribEqDRaw),
        valueB: r2(contribEqMRaw),
      }),
    );
    steps.push(
      i18n.t("calc.steps.leftovers", {
        partnerAName,
        partnerBName,
        valueA: r2(leftoverA),
        valueB: r2(leftoverB),
      }),
    );
    steps.push(
      i18n.t("calc.steps.cashDeposits", {
        partnerAName,
        partnerBName,
        valueA: r2(depositD),
        valueB: r2(depositM),
        total: r2(depositD + depositM),
      }),
    );
  }

  if (advanced && effectiveTR > eligibleTR) {
    warnings.push(
      i18n.t("calc.warnings.trNotFullyUsed", { amount: r2(effectiveTR - eligibleTR) })
    );
  }

  return {
    effectiveTRA: r2(effectiveTRA),
    effectiveTRB: r2(effectiveTRB),
    effectiveTR: r2(effectiveTR),
    usedTRA: r2(usedTRA),
    usedTRB: r2(usedTRB),
    V: r2(V),
    potTotal: r2(potTotal),
    cashNeeded: cashNeededRounded,
    shareD_raw: r2(shareD_raw),
    shareD_biased: r2(shareD_biased),
    shareM_biased: r2(shareM_biased),
    contribEqD: r2(contribEqDRaw),
    contribEqM: r2(contribEqMRaw),
    depositD,
    depositM,
    leftoverA,
    leftoverB,
    warnings,
    steps,
  };
}
