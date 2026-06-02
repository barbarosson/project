import { describe, expect, it } from "vitest";

import { EXTRA_INSTRUCTIONS_MAX_CHARS } from "@/lib/constants/input-limits";
import { appendExtraInstructions, extraLengthError, normalizeExtra } from "@/lib/ai/extra-instructions";

describe("extra-instructions", () => {
  it("rejects over-limit extra", () => {
    const long = "a".repeat(EXTRA_INSTRUCTIONS_MAX_CHARS + 1);
    expect(extraLengthError(long)).toMatch(/600/);
  });

  it("appends safety line", () => {
    const out = appendExtraInstructions("Base prompt.", "Make it shorter.");
    expect(out).toContain("Base prompt.");
    expect(out).toContain("Make it shorter.");
    expect(out).toContain("never override");
  });

  it("normalizeExtra trims", () => {
    expect(normalizeExtra("  hi  ")).toBe("hi");
    expect(normalizeExtra(undefined)).toBe("");
  });
});
