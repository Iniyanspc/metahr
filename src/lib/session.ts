import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "./db";
import { assertCan, type Actor, type Permission } from "./rbac";

/**
 * The signed-in user as an RBAC Actor, loaded once per request.
 * Manager scope comes from active direct reports; Intern from the current employment.
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findFirst({
    where: { id: session.user.id, isActive: true },
    select: {
      id: true,
      role: true,
      person: {
        select: {
          id: true,
          employments: {
            where: { endedOn: null, deletedAt: null },
            select: { type: true },
            take: 1,
          },
        },
      },
    },
  });
  if (!user) return null;

  const personId = user.person?.id ?? null;
  const reports = personId
    ? await db.employment.findMany({
        where: { managerId: personId, endedOn: null, status: { not: "EXITED" } },
        select: { personId: true },
      })
    : [];

  return {
    userId: user.id,
    personId,
    role: user.role,
    reportIds: reports.map((r) => r.personId),
    isIntern: user.person?.employments[0]?.type === "INTERN",
  };
});

/** For pages and layouts: redirect to /login when signed out. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/login");
  return actor;
}

/**
 * For Server Actions and route handlers: every mutation starts with this.
 * Throws ForbiddenError (never redirects) so actions can return a clean error.
 */
export async function authorize(permission: Permission, targetPersonId?: string | null) {
  const actor = await requireActor();
  assertCan(actor, permission, targetPersonId);
  return actor;
}
