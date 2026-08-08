/** Pure formatting helpers — safe to import from client components (no node deps). */

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatMonths(months: number[]): string {
  if (!months.length) return "Year-round";
  return months.map((m) => MONTHS[m - 1]).join(", ");
}

export function categoryLabel(category: string): string {
  return category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
