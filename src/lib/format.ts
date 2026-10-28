export const TIME_ZONE = "Asia/Kolkata";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: TIME_ZONE,
});

const isoDayFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

/** 28 Oct 2026. `@db.Date` values arrive as UTC midnight, so format those in UTC. */
export function formatDate(value: Date | null | undefined, opts: { calendarDate?: boolean } = {}) {
  if (!value) return "—";
  if (opts.calendarDate) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(value);
  }
  return dateFmt.format(value);
}

export function formatTime(value: Date | null | undefined) {
  return value ? timeFmt.format(value) : "—";
}

/** Today's calendar date in IST as "YYYY-MM-DD". */
export function todayIST(now: Date = new Date()) {
  return isoDayFmt.format(now);
}

/** A "YYYY-MM-DD" IST calendar day as the Date Prisma expects for @db.Date columns. */
export function calendarDate(isoDay: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) throw new Error(`Invalid date: ${isoDay}`);
  return new Date(`${isoDay}T00:00:00.000Z`);
}

const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,23,456.00 from integer paise. */
export function formatPaise(paise: number | null | undefined) {
  if (paise === null || paise === undefined) return "—";
  if (!Number.isInteger(paise)) throw new Error("Money must be integer paise");
  return inrFmt.format(paise / 100);
}

/** "12,345.67" → 1234567 paise. Rejects more than 2 decimals. */
export function rupeesToPaise(input: string): number {
  const clean = input.replace(/[₹,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(clean)) throw new Error("Enter an amount like 12345.67");
  const [whole, frac = ""] = clean.replace("-", "").split(".");
  const paise = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return clean.startsWith("-") ? -paise : paise;
}

/** Half-day units (1 = 0.5 day) → "1.5". */
export function formatDays(units: number) {
  const days = units / 2;
  return Number.isInteger(days) ? String(days) : days.toFixed(1);
}
