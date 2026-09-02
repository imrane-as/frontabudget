import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

export type MonthPeriod = {
  month: number;
  year: number;
  date: Date;
  start: string;
  end: string;
  label: string;
  key: string;
  isCurrent: boolean;
  previousHref: string | null;
  nextHref: string | null;
};

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("fr") + value.slice(1);
}

export function resolveMonthPeriod(
  rawMonth?: string | null,
  rawYear?: string | null,
  now = new Date()
): MonthPeriod {
  const currentDate = startOfMonth(now);
  const requestedMonth = Number(rawMonth);
  const requestedYear = Number(rawYear);
  const validMonth =
    Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12;
  const validYear =
    Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2100;
  const requestedDate = validMonth && validYear
    ? new Date(requestedYear, requestedMonth - 1, 1)
    : currentDate;
  const date = requestedDate > currentDate ? currentDate : requestedDate;
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear();
  const previous = subMonths(date, 1);
  const next = new Date(year, month, 1);
  const earliest = new Date(2020, 0, 1);

  return {
    month,
    year,
    date,
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
    label: capitalize(format(date, "MMMM yyyy", { locale: fr })),
    key: format(date, "yyyy-MM"),
    isCurrent,
    previousHref: date > earliest
      ? `/dashboard?month=${previous.getMonth() + 1}&year=${previous.getFullYear()}`
      : null,
    nextHref: isCurrent
      ? null
      : `/dashboard?month=${next.getMonth() + 1}&year=${next.getFullYear()}`
  };
}
