/**
 * Strict work-email check used before anything reaches nodemailer's address parser.
 * Only plain local parts (letters, digits, . _ % + -) on the allowed domain pass;
 * quotes, comments, angle brackets, groups and IDN tricks are rejected outright.
 */
export function normaliseWorkEmail(input: string, allowedDomain: string): string | null {
  const email = input.trim().toLowerCase();
  if (email.length > 254) return null;
  const match = /^([a-z0-9._%+-]{1,64})@([a-z0-9.-]+)$/.exec(email);
  if (!match) return null;
  const [, local, domain] = match;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;
  if (domain !== allowedDomain.toLowerCase()) return null;
  return email;
}
