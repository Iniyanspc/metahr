/** Only same-origin relative paths; anything else falls back to the dashboard. */
export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}
