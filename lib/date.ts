const pad = (n: number) => String(n).padStart(2, "0");

export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toMonthStr = (d: Date) => toDateStr(d).slice(0, 7);

export function daysInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  return Array.from({ length: count }, (_, i) => `${month}-${pad(i + 1)}`);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return toMonthStr(new Date(y, m - 1 + delta, 1));
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
export const weekdayOf = (dateStr: string) => WEEKDAYS[new Date(`${dateStr}T00:00:00`).getDay()];

export const formatMoney = (n: number) => Math.round(n).toLocaleString("zh-TW");
