import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { googleEnabled, env } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { signInWithGoogle } from "./actions";
import { MagicLinkForm } from "./magic-link-form";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  AccessDenied: "This account doesn't have access. Ask HR to add you.",
  Verification: "That sign-in link has expired or was already used. Request a new one.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Auth.js generates random values; render per request, not at prerender time.
  await connection();
  const session = await auth();
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  if (session?.user) redirect(next);

  const errorKey = typeof params.error === "string" ? params.error : undefined;
  const error = errorKey ? (ERRORS[errorKey] ?? "Sign-in failed. Try again.") : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <BrandMark className="text-2xl" />
          <p className="text-sm text-muted-foreground">Sign in with your metadatum work account.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {googleEnabled && (
          <>
            <form action={signInWithGoogle}>
              <input type="hidden" name="next" value={next} />
              <Button type="submit" variant="outline" size="lg" className="w-full">
                Continue with Google Workspace
              </Button>
            </form>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <MagicLinkForm next={next} domain={env.ALLOWED_EMAIL_DOMAIN} />
      </div>
    </main>
  );
}
