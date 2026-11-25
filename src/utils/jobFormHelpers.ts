// Weekend / business-day date helpers for the job pages.

export type JobTypeOption = { value: any; label?: string };

export const toYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const parseYMD = (value?: string | null): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isWeekend = (date: Date = new Date()): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const getNextBusinessDay = (from: Date = new Date()): Date => {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  while (isWeekend(next)) next.setDate(next.getDate() + 1);
  return next;
};

// The job date is the next business day after today (Friday → Monday).
export const isNextBusinessDayJob = (
  selectedYMD?: string | null,
  todayYMD?: string | null,
): boolean => {
  const selected = parseYMD(selectedYMD);
  const today = parseYMD(todayYMD);
  if (!selected || !today) return false;
  return selected.getTime() === getNextBusinessDay(today).getTime();
};

export const isStandardJobType = (option?: JobTypeOption | null): boolean =>
  (option?.label || "").toLowerCase().trim() === "standard";
