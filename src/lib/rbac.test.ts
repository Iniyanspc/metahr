import { describe, expect, it } from "vitest";
import { can, canApprove, scopeFor, type Actor } from "./rbac";

const actor = (overrides: Partial<Actor>): Actor => ({
  userId: "u",
  personId: "me",
  role: "EMPLOYEE",
  reportIds: [],
  isIntern: false,
  ...overrides,
});

const admin = actor({ role: "ADMIN" });
const hr = actor({ role: "HR" });
const employee = actor({});
const manager = actor({ reportIds: ["r1", "r2"] });
const hrManager = actor({ role: "HR", reportIds: ["r1"] });

describe("can", () => {
  it("lets employees see only their own full profile", () => {
    expect(can(employee, "person.view", "me")).toBe(true);
    expect(can(employee, "person.view", "someone-else")).toBe(false);
  });

  it("gives managers their direct reports but nobody else", () => {
    expect(can(manager, "person.view", "r1")).toBe(true);
    expect(can(manager, "person.view", "stranger")).toBe(false);
    expect(can(manager, "leave.approve", "r2")).toBe(true);
    expect(can(manager, "leave.approve", "stranger")).toBe(false);
  });

  it("never lets managers see statutory/bank data of reports", () => {
    expect(can(manager, "sensitive.viewMasked", "r1")).toBe(false);
    expect(can(manager, "sensitive.reveal", "r1")).toBe(false);
  });

  it("restricts payroll lock, settings.admin, roles and audit to Admin", () => {
    for (const p of ["payroll.lock", "settings.admin", "users.manageRoles", "audit.view"] as const) {
      expect(can(admin, p)).toBe(true);
      expect(can(hr, p)).toBe(false);
      expect(can(manager, p)).toBe(false);
      expect(can(employee, p)).toBe(false);
    }
  });

  it("lets HR prepare payroll and edit sensitive data", () => {
    expect(can(hr, "payroll.prepare")).toBe(true);
    expect(can(hr, "sensitive.reveal", "anyone")).toBe(true);
    expect(can(employee, "sensitive.reveal", "me")).toBe(false);
  });

  it("treats check-in as own-only even for Admin", () => {
    expect(can(admin, "attendance.checkIn", "me")).toBe(true);
    expect(can(admin, "attendance.checkIn", "someone-else")).toBe(false);
  });

  it("denies when the target is null for scoped permissions", () => {
    expect(can(employee, "person.view", null)).toBe(false);
    expect(can(hr, "person.view", null)).toBe(true);
  });

  it("answers 'anyone at all' without a target (for navigation)", () => {
    expect(can(employee, "payroll.prepare")).toBe(false);
    expect(can(employee, "leave.view")).toBe(true);
    expect(can(employee, "leave.approve")).toBe(false);
    expect(can(manager, "leave.approve")).toBe(true);
  });
});

describe("scopeFor", () => {
  it("returns the broadest scope held", () => {
    expect(scopeFor(hrManager, "leave.approve")).toBe("all");
    expect(scopeFor(manager, "leave.view")).toBe("reports");
    expect(scopeFor(employee, "leave.view")).toBe("own");
    expect(scopeFor(employee, "leave.approve")).toBeNull();
  });
});

describe("canApprove", () => {
  it("blocks approving your own request, even for HR and Admin", () => {
    expect(canApprove(hr, "leave.approve", "me")).toBe(false);
    expect(canApprove(admin, "regularisation.approve", "me")).toBe(false);
    expect(canApprove(hr, "leave.approve", "r1")).toBe(true);
  });

  it("limits managers to their reports", () => {
    expect(canApprove(manager, "leave.approve", "r1")).toBe(true);
    expect(canApprove(manager, "leave.approve", "stranger")).toBe(false);
  });
});
