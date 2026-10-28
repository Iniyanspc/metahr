import { describe, expect, it } from "vitest";
import { normaliseWorkEmail } from "./auth-email";
import { safeNextPath } from "./safe-redirect";

const D = "themetadatum.com";

describe("normaliseWorkEmail", () => {
  it("accepts and lower-cases plain work emails", () => {
    expect(normaliseWorkEmail("  Priya.Sharma@TheMetadatum.com ", D)).toBe("priya.sharma@themetadatum.com");
    expect(normaliseWorkEmail("a+hr@themetadatum.com", D)).toBe("a+hr@themetadatum.com");
  });

  it("rejects other domains and look-alikes", () => {
    expect(normaliseWorkEmail("x@gmail.com", D)).toBeNull();
    expect(normaliseWorkEmail("x@themetadatum.com.evil.io", D)).toBeNull();
    expect(normaliseWorkEmail("x@metadatum.com", D)).toBeNull();
    expect(normaliseWorkEmail("x@sub.themetadatum.com", D)).toBeNull();
    expect(normaliseWorkEmail("x@xn--metadatum-9za.com", D)).toBeNull();
  });

  it("rejects address-parser tricks", () => {
    for (const bad of [
      '"x@evil.io"@themetadatum.com',
      "x@evil.io(@themetadatum.com)",
      "Name <x@evil.io>, y@themetadatum.com",
      "x@evil.io;y@themetadatum.com",
      "x(comment)@themetadatum.com",
      "x@themetadatum.com\nBcc: y@evil.io",
      ".x@themetadatum.com",
      "x..y@themetadatum.com",
    ]) {
      expect(normaliseWorkEmail(bad, D), bad).toBeNull();
    }
  });
});

describe("safeNextPath", () => {
  it("allows same-origin paths only", () => {
    expect(safeNextPath("/people/abc")).toBe("/people/abc");
    expect(safeNextPath("https://evil.io")).toBe("/");
    expect(safeNextPath("//evil.io")).toBe("/");
    expect(safeNextPath("/\\evil.io")).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
  });
});
