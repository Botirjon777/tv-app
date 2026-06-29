// Per-hotel service fee applied to order subtotals. Type is "none" | "percent"
// | "fixed"; value is a percentage (e.g. 10) or a fixed UZS amount.

export type ServiceFeeType = "none" | "percent" | "fixed";

export function computeServiceFee(
  subtotal: number,
  type: string,
  value: number
): number {
  if (type === "percent") return Math.round((subtotal * value) / 100);
  if (type === "fixed") return value;
  return 0;
}
