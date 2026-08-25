/**
 * Format a number as a currency string using ৳ (BDT).
 * Uses integer arithmetic to avoid floating-point issues.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "৳"
): string {
  if (amount === null || amount === undefined) return `${currency}0`;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency}0`;
  return `${currency}${num.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format amount without currency symbol for inputs.
 */
export function formatAmount(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";
  return num.toFixed(2);
}

/**
 * Parse a currency string to a number.
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
}

/**
 * Round to 2 decimal places (for display/storage).
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
