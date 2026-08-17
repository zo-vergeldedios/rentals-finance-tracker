export function monthBounds(
  year: number,
  month: number
): [start: string, end: string] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const next = month === 12 ? new Date(year + 1, 0, 1) : new Date(year, month, 1);
  const end = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`;
  return [start, end];
}
