import { describe, expect, it } from "vitest";
import { calendarDate, formatDate, formatDays, formatPaise, rupeesToPaise, todayIST } from "./format";

describe("dates (Asia/Kolkata)", () => {
  it("formats as DD MMM YYYY", () => {
    expect(formatDate(new Date("2026-10-28T06:00:00Z"))).toBe("28 Oct 2026");
  });

  it("uses IST for instants near midnight UTC", () => {
    // 20:00 UTC on 28 Oct is 01:30 IST on 29 Oct
    expect(formatDate(new Date("2026-10-28T20:00:00Z"))).toBe("29 Oct 2026");
    expect(todayIST(new Date("2026-10-28T20:00:00Z"))).toBe("2026-10-29");
  });

  it("keeps @db.Date calendar dates on their own day", () => {
    expect(formatDate(calendarDate("2026-01-26"), { calendarDate: true })).toBe("26 Jan 2026");
  });
});

describe("money (integer paise)", () => {
  it("formats with ₹ and Indian digit grouping", () => {
    expect(formatPaise(123456789)).toBe("₹12,34,567.89");
    expect(formatPaise(0)).toBe("₹0.00");
  });

  it("refuses fractional paise", () => {
    expect(() => formatPaise(10.5)).toThrow();
  });

  it("parses rupee input without float drift", () => {
    expect(rupeesToPaise("12,34,567.89")).toBe(123456789);
    expect(rupeesToPaise("₹ 0.1")).toBe(10);
    expect(rupeesToPaise("1.15")).toBe(115);
    expect(rupeesToPaise("-250")).toBe(-25000);
    expect(() => rupeesToPaise("1.234")).toThrow();
    expect(() => rupeesToPaise("abc")).toThrow();
  });
});

describe("leave units", () => {
  it("shows half-day units as days", () => {
    expect(formatDays(3)).toBe("1.5");
    expect(formatDays(4)).toBe("2");
  });
});
