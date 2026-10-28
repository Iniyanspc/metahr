"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, type LoginState } from "./actions";

export function MagicLinkForm({ next, domain }: { next: string; domain: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestMagicLink, {});

  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={`you@${domain}`}
          required
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "email-error" : undefined}
          className="h-10"
        />
        {state.error && (
          <p id="email-error" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="h-10 w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
