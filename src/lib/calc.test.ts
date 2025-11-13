import { describe, it, expect } from "vitest";
import { calculate } from "./calc";
import type { Inputs } from "./types";

const base: Inputs = {
  partnerAName: "Partenaire A",
  partnerBName: "Partenaire B",
  a1: 2000,
  a2: 175,
  b2: 0,
  trPct: 100,
  b: 2000,
  m: 1500,
  advanced: false,
  E: 0,
  biasPts: 0,
  mode: "proportional",
};

describe("calculate", () => {
  it("simple case matches sum m", () => {
    const r = calculate(base);
    expect(r.depositD + r.depositM).toBeCloseTo(r.cashNeeded, 2);
    expect(r.cashNeeded).toBeCloseTo(1500, 2);
  });

  it("advanced: E > TR => cash includes E-V", () => {
    const inp: Inputs = { ...base, advanced: true, E: 600 };
    const r = calculate(inp);
    expect(r.cashNeeded).toBeCloseTo(1500 + (600 - 175), 2);
  });

  it("bias increases partner A's share", () => {
    const r0 = calculate(base);
    const r1 = calculate({ ...base, biasPts: 5 });
    expect(r1.depositD).toBeGreaterThanOrEqual(r0.depositD);
  });

  it("bounds negative deposit to zero", () => {
    const inp: Inputs = { ...base, m: 10, biasPts: 10 };
    const r = calculate(inp);
    expect(r.depositD).toBeGreaterThanOrEqual(0);
    expect(r.depositM).toBeCloseTo(r.cashNeeded, 2);
  });

  it("equal leftover simple case", () => {
    const r = calculate({ ...base, mode: "equal_leftover", b: 2000, a1: 2300, m: 1500 });
    expect(r.depositD + r.depositM).toBeCloseTo(r.cashNeeded, 2);
    expect(r.leftoverA).toBeCloseTo(r.leftoverB, 2);
  });

  it("equal leftover advanced with eligible expenses", () => {
    const inp: Inputs = {
      ...base,
      mode: "equal_leftover",
      advanced: true,
      E: 800,
      a1: 2200,
      b: 1800,
      a2: 150,
      b2: 120,
      trPct: 100,
      m: 1400,
    };
    const r = calculate(inp);
    const effectiveTRA = 150;
    const effectiveTRB = 120;
    const Vtotal = Math.min(effectiveTRA + effectiveTRB, inp.E);
    const expectedCash = inp.m + Math.max(0, inp.E - Vtotal);
    expect(r.cashNeeded).toBeCloseTo(expectedCash, 2);
    expect(r.leftoverA).toBeCloseTo(r.leftoverB, 2);
  });

  it("equal leftover bounds deposits when negative", () => {
    const inp: Inputs = { ...base, mode: "equal_leftover", a1: 500, b: 5000, m: 200 };
    const r = calculate(inp);
    expect(r.depositD).toBe(0);
    expect(r.depositM).toBeCloseTo(r.cashNeeded, 2);
    expect(r.leftoverA).toBeGreaterThanOrEqual(0);
  });

  it("proportional mode falls back to 50/50 when weights vanish", () => {
    const inp: Inputs = {
      ...base,
      a1: 0,
      a2: 0,
      b: 0,
      b2: 0,
      m: 120,
      trPct: 0,
    };
    const r = calculate(inp);
    expect(r.depositD).toBeCloseTo(60, 2);
    expect(r.depositM).toBeCloseTo(60, 2);
    expect(r.shareD_biased).toBeCloseTo(0.5, 2);
    expect(r.warnings).toContain(
      "Somme des revenus pondérés nulle — parts fixées à 50/50 par sécurité."
    );
  });

  it("advanced mode warns when TR exceed eligible expenses", () => {
    const inp: Inputs = {
      ...base,
      advanced: true,
      a2: 500,
      b2: 300,
      trPct: 100,
      E: 400,
      m: 200,
    };
    const r = calculate(inp);
    expect(r.usedTRA + r.usedTRB).toBeCloseTo(inp.E, 2);
    expect(r.warnings).toContain(
      "TR non utilisés intégralement: 400 € non consommés (E < TR)."
    );
  });

  it("bias in proportional mode reduces partner A share when negative", () => {
    const r0 = calculate(base);
    const rBias = calculate({ ...base, biasPts: -10 });
    expect(rBias.shareD_biased).toBeLessThan(r0.shareD_biased);
    expect(rBias.shareM_biased).toBeGreaterThan(r0.shareM_biased);
  });
});
