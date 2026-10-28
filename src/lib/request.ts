/** Best-effort client IP behind a proxy (Vercel / nginx set x-forwarded-for). */
export function clientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
