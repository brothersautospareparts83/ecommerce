import { describe, expect, it } from "vitest";
import { normalizeTzPhone } from "@/lib/phone";

describe("normalizeTzPhone", () => {
  it.each([
    ["0712 345 678", "+255712345678"],
    ["0712345678", "+255712345678"],
    ["+255 712 345 678", "+255712345678"],
    ["255712345678", "+255712345678"],
    ["712345678", "+255712345678"],
    ["(0627) 858-827", "+255627858827"],
    ["0741 939 264", "+255741939264"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeTzPhone(input)).toBe(expected);
  });

  it.each(["", "abc", "12345", "0112345678", "+254712345678", "07123456789", "0712 345 67"])("rejects %s", (input) => {
    expect(normalizeTzPhone(input)).toBeNull();
  });
});
