"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { signIn } from "@/auth";
import { normaliseWorkEmail } from "@/lib/auth-email";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { safeNextPath } from "@/lib/safe-redirect";

export type LoginState = { error?: string };

const schema = z.object({ email: z.string().min(1, "Enter your work email"), next: z.string().optional() });

export async function requestMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = normaliseWorkEmail(parsed.data.email, env.ALLOWED_EMAIL_DOMAIN);
  if (!email) return { error: `Use your @${env.ALLOWED_EMAIL_DOMAIN} work email.` };

  const ip = clientIp(await headers());
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`magic-ip:${ip}`, 10, 900),
    rateLimit(`magic-email:${email}`, 3, 900),
  ]);
  if (!byIp.ok || !byEmail.ok) {
    return { error: "Too many sign-in requests. Wait 15 minutes and try again." };
  }

  // Redirects to /login/check-email. Unknown addresses get the same page (no account enumeration).
  await signIn("nodemailer", { email, redirectTo: safeNextPath(parsed.data.next) });
  return {};
}

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeNextPath(formData.get("next")?.toString()) });
}
