import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

/**
 * Field-level encryption for statutory and bank data (AES-256-GCM).
 *
 * FIELD_ENCRYPTION_KEY = "v2:<base64>,v1:<base64>" — the first key encrypts,
 * all keys can decrypt. Ciphertext format: "<version>.<iv>.<tag>.<data>" (base64url parts).
 */

type Key = { version: string; key: Buffer };

function parseKeys(raw: string | undefined): Key[] {
  if (!raw) throw new Error("FIELD_ENCRYPTION_KEY is not set");
  return raw.split(",").map((entry) => {
    const [version, b64] = entry.trim().split(":");
    const key = Buffer.from(b64 ?? "", "base64");
    if (!version || key.length !== 32) {
      throw new Error("FIELD_ENCRYPTION_KEY entries must look like v1:<32 bytes base64>");
    }
    return { version, key };
  });
}

let cached: { raw: string; keys: Key[] } | undefined;
function keys(): Key[] {
  const raw = process.env.FIELD_ENCRYPTION_KEY ?? "";
  if (cached?.raw !== raw) cached = { raw, keys: parseKeys(raw) };
  return cached.keys;
}

export function encrypt(plaintext: string): string {
  const { version, key } = keys()[0];
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [version, iv, tag, data]
    .map((p) => (typeof p === "string" ? p : p.toString("base64url")))
    .join(".");
}

export function decrypt(ciphertext: string): string {
  const [version, iv, tag, data] = ciphertext.split(".");
  const match = keys().find((k) => k.version === version);
  if (!match || !iv || !tag || data === undefined) throw new Error("Unreadable ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", match.key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Deterministic keyed hash for duplicate checks / exact lookups (e.g. PAN). */
export function blindIndex(value: string): string {
  const key = process.env.BLIND_INDEX_KEY;
  if (!key) throw new Error("BLIND_INDEX_KEY is not set");
  return createHmac("sha256", Buffer.from(key, "base64"))
    .update(value.trim().toUpperCase())
    .digest("base64url");
}

export function last4(value: string): string {
  return value.replace(/\s/g, "").slice(-4);
}

/** "XXXX XXXX 1234" style mask from stored last-4 digits. */
export function mask(last: string | null | undefined, length = 12): string {
  if (!last) return "—";
  return "•".repeat(Math.max(length - last.length, 4)) + last;
}
