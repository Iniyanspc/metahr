import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { basePrisma } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireActor } from "@/lib/session";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 50;

export default async function AuditLogPage({ searchParams }: PageProps<"/settings/audit">) {
  const actor = await requireActor();
  if (!can(actor, "audit.view")) notFound();

  const params = await searchParams;
  const entityType = typeof params.entity === "string" ? params.entity : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [rows, total, entityTypes] = await Promise.all([
    basePrisma.auditLog.findMany({
      where: entityType ? { entityType } : undefined,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { email: true } } },
    }),
    basePrisma.auditLog.count({ where: entityType ? { entityType } : undefined }),
    basePrisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => `?${new URLSearchParams({ ...(entityType ? { entity: entityType } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Audit log" description="Every create, update and delete on people, payroll and access records. Admin only." />

      <form className="mb-4 flex items-end gap-2" method="get">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Record type</span>
          <select name="entity" defaultValue={entityType ?? ""} className="h-8 rounded-lg border border-input bg-white px-2 text-sm">
            <option value="">All</option>
            {entityTypes.map((e) => (
              <option key={e.entityType}>{e.entityType}</option>
            ))}
          </select>
        </label>
        <button className="h-8 rounded-lg border border-border px-3 text-sm hover:bg-muted">Filter</button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No audit entries yet. Changes to people, payroll and access records will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="align-top">
                  <TableCell className="whitespace-nowrap">
                    {formatDate(r.createdAt)} <span className="text-muted-foreground">{formatTime(r.createdAt)}</span>
                  </TableCell>
                  <TableCell>{r.actor?.email ?? "system"}</TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell>
                    {r.entityType} <span className="font-mono text-xs text-muted-foreground">{r.entityId}</span>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <ChangeList before={r.before} after={r.after} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 && <a className="text-primary underline" href={href(page - 1)}>Previous</a>}
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          {page < pages && <a className="text-primary underline" href={href(page + 1)}>Next</a>}
        </nav>
      )}
    </>
  );
}

function ChangeList({ before, after }: { before: unknown; after: unknown }) {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  if (keys.length === 0) return <span className="text-muted-foreground">—</span>;
  const show = (v: unknown) => (v === null || v === undefined ? "∅" : typeof v === "object" ? JSON.stringify(v) : String(v));
  return (
    <ul className="space-y-0.5 text-xs">
      {keys.map((k) => (
        <li key={k} className="break-words">
          <span className="font-medium">{k}</span>: <span className="text-muted-foreground line-through decoration-1">{k in b ? show(b[k]) : ""}</span>{" "}
          {k in a && <span>{show(a[k])}</span>}
        </li>
      ))}
    </ul>
  );
}
