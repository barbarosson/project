import { describe, expect, it } from "vitest";

import { outputLanguageDirective } from "./output-locale";

describe("outputLanguageDirective", () => {
  it("defaults to Turkish when locale is tr", () => {
    const block = outputLanguageDirective("tr", "Merhaba dünya");
    expect(block).toContain("Turkish");
    expect(block).not.toContain("Never ignore");
    expect(block).toContain("mandatory");
  });

  it("requires matching user input language", () => {
    const block = outputLanguageDirective("en");
    expect(block).toContain("same natural language");
    expect(block).toContain("Do **not** reply in English unless");
  });
});
