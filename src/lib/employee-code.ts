import type { EmploymentType } from "@/generated/prisma/client";
import type { Tx } from "./db";

export function formatEmployeeCode(type: EmploymentType, n: number) {
  return type === "INTERN"
    ? `MD-INT-${String(n).padStart(3, "0")}`
    : `MD-${String(n).padStart(4, "0")}`;
}

/** Next code in sequence. Must run inside the transaction that creates the Employment. */
export async function nextEmployeeCode(tx: Tx, type: EmploymentType) {
  const key = type === "INTERN" ? "MD-INT" : "MD";
  const counter = await tx.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return formatEmployeeCode(type, counter.value);
}
