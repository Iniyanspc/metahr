import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <BrandMark className="text-2xl" />
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If that address belongs to a metadatum account, a sign-in link is on its way. It expires in 15 minutes.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <p className="text-sm">
            Local dev: open{" "}
            <a className="text-primary underline" href="http://localhost:8025" target="_blank" rel="noreferrer">
              Mailpit
            </a>
            .
          </p>
        )}
        <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
