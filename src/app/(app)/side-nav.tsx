"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CURRENT_PHASE, type NavItem } from "@/lib/nav";

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // Longest matching href wins, so /settings/audit doesn't also highlight /settings.
  const activeHref = items
    .map((i) => i.href)
    .filter((href) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;

  return (
    <nav aria-label="Main" className="overflow-x-auto px-2 pb-2 md:overflow-visible md:pb-0">
      <ul className="flex gap-1 md:flex-col">
        {items.map((item) => {
          const shipped = item.phase <= CURRENT_PHASE;
          const active = shipped && isActive(item.href);
          const base =
            "relative flex items-center justify-between gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm";
          return (
            <li key={item.href}>
              {shipped ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    base,
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded before:bg-brand-pink"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-disabled="true" className={cn(base, "cursor-not-allowed text-muted-foreground")}>
                  {item.label}
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                    Phase {item.phase}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
