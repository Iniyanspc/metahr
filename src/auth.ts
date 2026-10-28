import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { createTransport } from "nodemailer";
import { basePrisma } from "@/lib/db";
import { env, googleEnabled } from "@/lib/env";
import { normaliseWorkEmail } from "@/lib/auth-email";
import type { Role } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
}

/** Only pre-provisioned, active users may sign in. No self sign-up. */
async function findActiveUser(email: string | null | undefined) {
  const normalised = email ? normaliseWorkEmail(email, env.ALLOWED_EMAIL_DOMAIN) : null;
  if (!normalised) return null;
  return basePrisma.user.findFirst({
    where: { email: normalised, isActive: true, deletedAt: null },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(basePrisma),
  session: { strategy: "database", maxAge: 7 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  trustHost: true,
  pages: { signIn: "/login", verifyRequest: "/login/check-email", error: "/login" },
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            // Existing users are created by HR, so link Google to them by verified email.
            allowDangerousEmailAccountLinking: true,
            authorization: { params: { hd: env.ALLOWED_EMAIL_DOMAIN, prompt: "select_account" } },
          }),
        ]
      : []),
    Nodemailer({
      server: env.EMAIL_SERVER,
      from: env.EMAIL_FROM,
      maxAge: 15 * 60,
      normalizeIdentifier(identifier) {
        const email = normaliseWorkEmail(identifier, env.ALLOWED_EMAIL_DOMAIN);
        if (!email) throw new Error("Invalid work email");
        return email;
      },
      async sendVerificationRequest({ identifier, url, provider }) {
        // Send to the address on file, never to the raw form input.
        const user = await findActiveUser(identifier);
        if (!user) return;
        const transport = createTransport(provider.server);
        const { host } = new URL(url);
        await transport.sendMail({
          to: user.email,
          from: provider.from,
          subject: "Your sign-in link for metadatum People",
          text: `Sign in to ${host}:\n\n${url}\n\nThis link expires in 15 minutes and can be used once. If you didn't ask for it, ignore this email.`,
          html: `<p>Sign in to <strong>metadatum People</strong>:</p><p><a href="${url}">Sign in</a></p><p style="color:#555">This link expires in 15 minutes and can be used once. If you didn't ask for it, ignore this email.</p>`,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user, email }) {
      if (account?.provider === "google") {
        if (!profile?.email_verified || profile.hd !== env.ALLOWED_EMAIL_DOMAIN) return false;
        return Boolean(await findActiveUser(profile.email));
      }
      // Link request: always "succeed" so the response doesn't reveal who has an account.
      // sendVerificationRequest only emails real users; the check below runs on link click.
      if (email?.verificationRequest) return true;
      return Boolean(await findActiveUser(user.email));
    },
    session({ session, user }) {
      const u = user as typeof user & { role: Role };
      session.user.id = u.id;
      session.user.role = u.role;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await basePrisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
    },
  },
});
