import { describe, expect, it } from "vitest";

import { parseConciergeModelOutput, parseConciergeProseFallback } from "@/lib/concierge-parse";

describe("parseConciergeModelOutput", () => {
  it("parses JSON and sanitizes leaked metadata inside reply", () => {
    const raw = JSON.stringify({
      reply: 'Merhaba!\n\nSuggested tools: ["awkward-text-fixer"]',
      suggested_tools: ["awkward-text-fixer"],
    });
    const parsed = parseConciergeModelOutput(raw);
    expect(parsed?.reply).toBe("Merhaba!");
    expect(parsed?.suggested_tools).toEqual(["awkward-text-fixer"]);
  });
});

describe("parseConciergeProseFallback", () => {
  it("handles prose with trailing English leak", () => {
    const raw =
      "Bu mesaj samimi.\n\nÖnerim: Garip Metin Düzeltici.\n\nSuggested tools: [\"awkward-text-fixer\"]";
    const parsed = parseConciergeProseFallback(raw);
    expect(parsed.reply).not.toMatch(/Suggested tools/i);
    expect(parsed.suggested_tools).toEqual(["awkward-text-fixer"]);
  });
});
