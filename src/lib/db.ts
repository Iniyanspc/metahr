import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { softDeleteExtension } from "./soft-delete";

function createBaseClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  basePrisma?: ReturnType<typeof createBaseClient>;
};

/**
 * Unfiltered client. Only for the Auth.js adapter and the audit-log viewer;
 * application code uses `db`.
 */
export const basePrisma = globalForPrisma.basePrisma ?? createBaseClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.basePrisma = basePrisma;

/** Application client: hides soft-deleted rows and turns deletes into soft deletes. */
export const db = basePrisma.$extends(softDeleteExtension);

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["$transaction"]>[0]>[0];
