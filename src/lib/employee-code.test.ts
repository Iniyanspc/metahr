import { describe, expect, it } from "vitest";
import { formatEmployeeCode } from "./employee-code";

describe("formatEmployeeCode", () => {
  it("pads employees to 4 digits and interns to 3", () => {
    expect(formatEmployeeCode("FULL_TIME", 1)).toBe("MD-0001");
    expect(formatEmployeeCode("CONTRACT", 42)).toBe("MD-0042");
    expect(formatEmployeeCode("INTERN", 7)).toBe("MD-INT-007");
  });
});
