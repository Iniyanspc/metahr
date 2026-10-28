import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireActor } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

// Phase 1 dashboard: headcount for HR/Admin, profile basics for everyone.
// Attendance, leave, payroll and approvals widgets arrive with their modules.
export default async function DashboardPage() {
  const actor = await requireActor();

  const person = actor.personId
    ? await db.person.findUnique({
        where: { id: actor.personId },
        select: {
          firstName: true,
          employments: {
            where: { endedOn: null, deletedAt: null },
            take: 1,
            select: {
              employeeCode: true,
              joiningDate: true,
              department: { select: { name: true } },
              designation: { select: { title: true } },
              manager: { select: { firstName: true, lastName: true } },
            },
          },
        },
      })
    : null;
  const employment = person?.employments[0];

  const headcount = can(actor, "dashboard.hr")
    ? await db.employment.groupBy({
        by: ["type"],
        where: { endedOn: null, status: { not: "EXITED" } },
        _count: { _all: true },
      })
    : null;
  const count = (type: string) => headcount?.find((h) => h.type === type)?._count._all ?? 0;

  return (
    <>
      <PageHeader title={`Hello${person ? `, ${person.firstName}` : ""}`} description={formatDate(new Date())} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {employment && (
          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Employee ID</dt>
                <dd className="font-medium tabular-nums">{employment.employeeCode}</dd>
                <dt className="text-muted-foreground">Role</dt>
                <dd>{employment.designation?.title ?? "—"}</dd>
                <dt className="text-muted-foreground">Department</dt>
                <dd>{employment.department?.name ?? "—"}</dd>
                <dt className="text-muted-foreground">Manager</dt>
                <dd>{employment.manager ? `${employment.manager.firstName} ${employment.manager.lastName}` : "—"}</dd>
                <dt className="text-muted-foreground">Joined</dt>
                <dd>{formatDate(employment.joiningDate, { calendarDate: true })}</dd>
              </dl>
            </CardContent>
          </Card>
        )}

        {headcount && (
          <Card>
            <CardHeader>
              <CardTitle>Headcount</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-8">
              <Stat label="Employees" value={count("FULL_TIME") + count("CONTRACT")} />
              <Stat label="Interns" value={count("INTERN")} />
            </CardContent>
          </Card>
        )}

        {actor.reportIds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your team</CardTitle>
            </CardHeader>
            <CardContent>
              <Stat label="Direct reports" value={actor.reportIds.length} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-heading text-3xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
