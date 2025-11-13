export const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export const pct = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 }).format(n);

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
