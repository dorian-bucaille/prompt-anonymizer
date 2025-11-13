import { describe, expect, it } from "vitest";
import { clamp, euro, pct, round2 } from "./format";

describe("format helpers", () => {
  it("formats euros using the French locale", () => {
    const amount = 1234.5;
    expect(euro(amount)).toBe(
      new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)
    );
  });

  it("formats percentages with a single decimal", () => {
    const ratio = 0.1234;
    expect(pct(ratio)).toBe(
      new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 }).format(ratio)
    );
  });

  it("rounds to two decimals", () => {
    expect(round2(1.234)).toBeCloseTo(1.23, 5);
    expect(round2(-3.991)).toBeCloseTo(-3.99, 5);
  });

  it("clamps values within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
