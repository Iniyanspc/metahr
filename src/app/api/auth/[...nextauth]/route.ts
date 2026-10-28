import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export const { GET } = handlers;

// 20 auth POSTs (sign-in attempts, callbacks) per IP per 10 minutes.
export async function POST(request: NextRequest) {
  const limited = await rateLimit(`auth-post:${clientIp(request.headers)}`, 20, 600);
  if (!limited.ok) {
    return new Response("Too many attempts. Try again in a few minutes.", { status: 429 });
  }
  return handlers.POST(request);
}
