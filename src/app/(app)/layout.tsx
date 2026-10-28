import { Suspense } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { db } from "@/lib/db";
import { navFor } from "@/lib/nav";
import { requireActor } from "@/lib/session";
import { SideNav } from "./side-nav";
import { UserMenu } from "./user-menu";

// Static shell (brand, frame) prerenders; anything that reads the session streams in
// behind a Suspense boundary. Every page also calls requireActor() itself.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <aside className="border-b border-border md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" aria-label="metadatum People home">
            <BrandMark />
          </Link>
          <div className="md:hidden">
            <Suspense>
              <CurrentUserMenu />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={<NavSkeleton />}>
          <Nav />
        </Suspense>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden h-14 items-center justify-end border-b border-border px-6 md:flex">
          <Suspense>
            <CurrentUserMenu />
          </Suspense>
        </header>
        <main id="main" className="flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

async function Nav() {
  const actor = await requireActor();
  return <SideNav items={navFor(actor)} />;
}

async function CurrentUserMenu() {
  const actor = await requireActor();
  const user = await db.user.findUniqueOrThrow({
    where: { id: actor.userId },
    select: { email: true, name: true, person: { select: { firstName: true, lastName: true } } },
  });
  const name = user.person ? `${user.person.firstName} ${user.person.lastName}` : (user.name ?? user.email);
  const roleLabel = [
    actor.role === "ADMIN" ? "Admin" : actor.role === "HR" ? "HR" : actor.isIntern ? "Intern" : "Employee",
    actor.reportIds.length > 0 ? "Manager" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return <UserMenu name={name} email={user.email} roleLabel={roleLabel} />;
}

function NavSkeleton() {
  return (
    <div className="space-y-1 px-2" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
