/**
 * Permission matrix (docs/plan/PLAN.md §3). Pure — no DB access — so it is unit-testable.
 *
 * Stored roles are ADMIN / HR / EMPLOYEE. "Manager" is derived from having active
 * direct reports and only ever *adds* scope over those reports.
 */

export type Role = "ADMIN" | "HR" | "EMPLOYEE";

export type Actor = {
  userId: string;
  personId: string | null;
  role: Role;
  /** personIds of active direct reports; non-empty ⇒ acts as Manager */
  reportIds: readonly string[];
  isIntern: boolean;
};

/** all = any record; reports = own direct reports; own = the actor's own records */
type Scope = "all" | "reports" | "own";

type Grants = { ADMIN?: Scope; HR?: Scope; MANAGER?: Scope; EMPLOYEE?: Scope };

const ALL_STAFF: Grants = { ADMIN: "all", HR: "all" };
const ADMIN_ONLY: Grants = { ADMIN: "all" };

export const PERMISSIONS = {
  "directory.view": { ADMIN: "all", HR: "all", EMPLOYEE: "all" },
  "person.view": { ADMIN: "all", HR: "all", MANAGER: "reports", EMPLOYEE: "own" },
  "person.create": ALL_STAFF,
  "person.edit": ALL_STAFF,
  "person.editContact": { ADMIN: "all", HR: "all", EMPLOYEE: "own" },
  "sensitive.viewMasked": { ADMIN: "all", HR: "all", EMPLOYEE: "own" },
  "sensitive.reveal": ALL_STAFF,
  "sensitive.edit": ALL_STAFF,
  "employment.manage": ALL_STAFF, // conversion, separation, status

  "checklist.view": { ADMIN: "all", HR: "all", MANAGER: "reports", EMPLOYEE: "own" },
  "checklist.manage": ALL_STAFF,
  "checklistTemplate.manage": ALL_STAFF,

  "access.view": { ADMIN: "all", HR: "all", MANAGER: "reports", EMPLOYEE: "own" },
  "access.manage": ALL_STAFF,
  "asset.view": { ADMIN: "all", HR: "all", MANAGER: "reports", EMPLOYEE: "own" },
  "asset.manage": ALL_STAFF,

  "attendance.checkIn": { ADMIN: "own", HR: "own", EMPLOYEE: "own" },
  "attendance.view": { ADMIN: "all", HR: "all", MANAGER: "reports", EMPLOYEE: "own" },
  "attendance.edit": ALL_STAFF,
  "regularisation.request": { ADMIN: "own", HR: "own", EMPLOYEE: "own" },
  "regularisation.approve": { ADMIN: "all", HR: "all", MANAGER: "reports" },

  "leave.apply": { ADMIN: "own", HR: "own", EMPLOYEE: "own" },
  "leave.view": { ADMIN: "all", HR: "all", MANAGER: "reports", EMPLOYEE: "own" },
  "leave.approve": { ADMIN: "all", HR: "all", MANAGER: "reports" },
  "leave.adjust": ALL_STAFF,

  "salary.manage": ALL_STAFF,
  "payroll.prepare": ALL_STAFF,
  "payroll.lock": ADMIN_ONLY,
  "payroll.payments": ALL_STAFF,
  "payslip.view": { ADMIN: "all", HR: "all", EMPLOYEE: "own" },
  "reimbursement.submit": { ADMIN: "own", HR: "own", EMPLOYEE: "own" },
  "reimbursement.view": { ADMIN: "all", HR: "all", MANAGER: "reports", EMPLOYEE: "own" },
  "reimbursement.managerApprove": { ADMIN: "all", HR: "all", MANAGER: "reports" },
  "reimbursement.finalApprove": ALL_STAFF,

  "document.view": { ADMIN: "all", HR: "all", EMPLOYEE: "own" },
  "document.uploadOwn": { ADMIN: "all", HR: "all", EMPLOYEE: "own" },
  "document.manage": ALL_STAFF,

  "settings.hr": ALL_STAFF, // holidays, leave policies, departments, templates, checklists
  "settings.admin": ADMIN_ONLY, // company, statutory, salary components, bank format
  "users.manageRoles": ADMIN_ONLY,
  "audit.view": ADMIN_ONLY,
  "export.any": ALL_STAFF,
  "dashboard.hr": ALL_STAFF,
} as const satisfies Record<string, Grants>;

export type Permission = keyof typeof PERMISSIONS;

export function isManager(actor: Actor) {
  return actor.reportIds.length > 0;
}

/** Broadest scope this actor holds for a permission, or null. */
export function scopeFor(actor: Actor, permission: Permission): Scope | null {
  const grants: Grants = PERMISSIONS[permission];
  const order: Scope[] = ["all", "reports", "own"];
  const held = [grants[actor.role], isManager(actor) ? grants.MANAGER : undefined].filter(
    (s): s is Scope => Boolean(s),
  );
  return order.find((s) => held.includes(s)) ?? null;
}

/**
 * Can `actor` do `permission`, optionally on records belonging to `targetPersonId`?
 * Without a target, answers "can they do this to anyone at all" (for nav/menus).
 */
export function can(actor: Actor, permission: Permission, targetPersonId?: string | null) {
  const grants: Grants = PERMISSIONS[permission];
  const scopes = [grants[actor.role], isManager(actor) ? grants.MANAGER : undefined];
  if (targetPersonId === undefined) return scopes.some(Boolean);

  return scopes.some((scope) => {
    if (scope === "all") return true;
    if (!targetPersonId) return false;
    if (scope === "own") return targetPersonId === actor.personId;
    if (scope === "reports") return actor.reportIds.includes(targetPersonId);
    return false;
  });
}

/** Approvals: nobody decides their own request, whatever their role. */
export function canApprove(
  actor: Actor,
  permission: Extract<
    Permission,
    "leave.approve" | "regularisation.approve" | "reimbursement.managerApprove"
  >,
  requesterPersonId: string,
) {
  return requesterPersonId !== actor.personId && can(actor, permission, requesterPersonId);
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertCan(actor: Actor, permission: Permission, targetPersonId?: string | null) {
  if (!can(actor, permission, targetPersonId)) throw new ForbiddenError();
}
