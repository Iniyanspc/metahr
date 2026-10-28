import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { blindIndex, decrypt, encrypt, last4, mask } from "./crypto";

const k1 = `v1:${randomBytes(32).toString("base64")}`;
const k2 = `v2:${randomBytes(32).toString("base64")}`;

beforeEach(() => {
  process.env.FIELD_ENCRYPTION_KEY = k1;
  process.env.BLIND_INDEX_KEY = randomBytes(32).toString("base64");
});
afterEach(() => {
  delete process.env.FIELD_ENCRYPTION_KEY;
  delete process.env.BLIND_INDEX_KEY;
});

describe("field encryption", () => {
  it("round-trips and never contains the plaintext", () => {
    const ct = encrypt("ABCPK1234Z");
    expect(ct).not.toContain("ABCPK1234Z");
    expect(ct.startsWith("v1.")).toBe(true);
    expect(decrypt(ct)).toBe("ABCPK1234Z");
  });

  it("uses a fresh IV each time", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("detects tampering", () => {
    const [v, iv, tag, data] = encrypt("123456789012").split(".");
    const flipped = data.slice(0, -2) + (data.endsWith("A") ? "B" : "A") + data.slice(-1);
    expect(() => decrypt([v, iv, tag, flipped].join("."))).toThrow();
  });

  it("supports key rotation: new key encrypts, old key still decrypts", () => {
    const old = encrypt("old-secret");
    process.env.FIELD_ENCRYPTION_KEY = `${k2},${k1}`;
    expect(encrypt("x").startsWith("v2.")).toBe(true);
    expect(decrypt(old)).toBe("old-secret");
  });

  it("rejects malformed keys", () => {
    process.env.FIELD_ENCRYPTION_KEY = "v1:short";
    expect(() => encrypt("x")).toThrow(/32 bytes/);
  });
});

describe("blind index", () => {
  it("is deterministic and case/space-insensitive", () => {
    expect(blindIndex("abcpk1234z ")).toBe(blindIndex("ABCPK1234Z"));
    expect(blindIndex("ABCPK1234Z")).not.toBe(blindIndex("ABCPK1234Y"));
  });
});

describe("masking", () => {
  it("shows only the last four", () => {
    expect(last4("1234 5678 9012")).toBe("9012");
    expect(mask("9012")).toBe("••••••••9012");
    expect(mask(null)).toBe("—");
  });
});
