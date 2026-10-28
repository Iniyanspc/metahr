import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function UserMenu({ name, email, roleLabel }: { name: string; email: string; roleLabel: string }) {
  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right leading-tight sm:block">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          {roleLabel} · {email}
        </p>
      </div>
      <form action={doSignOut}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}
