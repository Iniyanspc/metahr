import { can, type Actor, type Permission } from "./rbac";

export type NavItem = {
  href: string;
  label: string;
  permission: Permission;
  /** Phase that ships the page; items from later phases render disabled. */
  phase: number;
};

export const CURRENT_PHASE = 1;

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", permission: "directory.view", phase: 1 },
  { href: "/people", label: "People", permission: "directory.view", phase: 2 },
  { href: "/onboarding", label: "Onboarding", permission: "checklist.view", phase: 2 },
  { href: "/access", label: "Access & assets", permission: "access.view", phase: 2 },
  { href: "/attendance", label: "Attendance", permission: "attendance.view", phase: 3 },
  { href: "/leave", label: "Leave", permission: "leave.view", phase: 3 },
  { href: "/payroll", label: "Payroll", permission: "payroll.prepare", phase: 4 },
  { href: "/payslips", label: "Payslips", permission: "payslip.view", phase: 4 },
  { href: "/reimbursements", label: "Reimbursements", permission: "reimbursement.view", phase: 4 },
  { href: "/documents", label: "Documents", permission: "document.view", phase: 5 },
  { href: "/settings", label: "Settings", permission: "settings.hr", phase: 6 },
  { href: "/settings/audit", label: "Audit log", permission: "audit.view", phase: 1 },
];

export function navFor(actor: Actor) {
  return NAV.filter((item) => can(actor, item.permission));
}
