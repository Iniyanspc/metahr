import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only: bounce requests without a session cookie to /login.
 * Real authentication and RBAC happen in every page, action and route handler.
 */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const login = new URL("/login", request.url);
  const path = request.nextUrl.pathname;
  if (path !== "/") login.searchParams.set("next", path);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except auth endpoints, the login pages, cron (own secret) and static assets.
  matcher: ["/((?!api/auth|api/cron|login|_next/static|_next/image|favicon.ico|brand/).*)"],
};
