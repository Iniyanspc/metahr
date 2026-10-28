import "server-only";
import type { AuditAction } from "@/generated/prisma/client";
import type { Tx } from "./db";

const SECRET_FIELD = /(Enc|Hash)$/;
const DROP_FIELDS = new Set(["createdAt", "updatedAt"]);

type Row = Record<string, unknown> | null | undefined;

/** Strip timestamps and replace encrypted/hashed values with a marker. */
export function redact(row: Row): Record<string, unknown> | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (DROP_FIELDS.has(k)) continue;
    if (SECRET_FIELD.test(k)) out[k] = v == null ? null : "«encrypted»";
    else if (v instanceof Date) out[k] = v.toISOString();
    else out[k] = v;
  }
  return out;
}

/** For UPDATE: keep only keys whose value changed, so the log shows the diff. */
export function diff(before: Row, after: Row) {
  const b = redact(before) ?? {};
  const a = redact(after) ?? {};
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  for (const k of keys) {
    const changed =
      SECRET_FIELD.test(k)
        ? (before?.[k] ?? null) !== (after?.[k] ?? null)
        : JSON.stringify(b[k]) !== JSON.stringify(a[k]);
    if (changed) {
      changedBefore[k] = SECRET_FIELD.test(k) && b[k] ? "«changed»" : b[k];
      changedAfter[k] = SECRET_FIELD.test(k) && a[k] ? "«changed»" : a[k];
    }
  }
  return { before: changedBefore, after: changedAfter };
}

export type AuditEntry = {
  actorId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: Row;
  after?: Row;
};

/** Write an audit row inside the same transaction as the change it records. */
export async function audit(tx: Tx, entry: AuditEntry) {
  const values =
    entry.action === "UPDATE"
      ? diff(entry.before, entry.after)
      : { before: redact(entry.before), after: redact(entry.after) };

  await tx.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: (values.before ?? undefined) as object | undefined,
      after: (values.after ?? undefined) as object | undefined,
    },
  });
}
