import { Prisma } from "@/generated/prisma/client";

/** Models without a deletedAt column (adapter tables, counters, append-only logs). */
const HARD_MODELS = new Set([
  "Account",
  "Session",
  "VerificationToken",
  "RateLimitHit",
  "Counter",
  "CompanySettings",
  "AuditLog",
]);

const READ_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "updateManyAndReturn",
]);

export function isSoftDeletable(model: string) {
  return !HARD_MODELS.has(model);
}

/**
 * - Reads (and bulk updates) only see rows with deletedAt = null unless the
 *   caller filters on deletedAt explicitly.
 * - delete / deleteMany set deletedAt instead of removing rows.
 * Relation includes are not filtered automatically: pass `where: { deletedAt: null }`
 * on included to-many relations.
 */
export const softDeleteExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: "soft-delete",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!isSoftDeletable(model)) return query(args);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const a = (args ?? {}) as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const delegate = (client as any)[model.charAt(0).toLowerCase() + model.slice(1)];

          if (operation === "delete") {
            return delegate.update({ ...a, data: { deletedAt: new Date() } });
          }
          if (operation === "deleteMany") {
            return delegate.updateMany({ where: a.where, data: { deletedAt: new Date() } });
          }
          if (READ_OPS.has(operation)) {
            const where = a.where ?? {};
            if (!("deletedAt" in where)) a.where = { ...where, deletedAt: null };
            return query(a);
          }
          return query(args);
        },
      },
    },
  }),
);
