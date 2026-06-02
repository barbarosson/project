import { describe, expect, it } from "vitest";

import {
  alignSuggestedTools,
  isRomanticAskOutIntent,
  rankToolsForUserIntent,
  toolsAlignWithIntent,
} from "@/lib/intent-tool-routing";

describe("romantic ask-out intent", () => {
  const sample =
    "beğendiğim bir insan var ona çıkma teklif etmek istiyorum bana yardımcı olur musun";

  it("detects Turkish ask-out phrasing", () => {
    expect(isRomanticAskOutIntent(sample)).toBe(true);
  });

  it("ranks message tools ahead of dating-roast", () => {
    const ranked = rankToolsForUserIntent(sample);
    expect(ranked[0]).toBe("awkward-text-fixer");
    expect(ranked).toContain("delicate-truth");
    expect(ranked).not.toContain("dating-roast");
  });

  it("alignSuggestedTools blocks dating-roast for concierge", () => {
    const aligned = alignSuggestedTools(sample, ["dating-roast", "corporate-whisperer"]);
    expect(aligned).not.toContain("dating-roast");
    expect(aligned).toContain("delicate-truth");
  });

  it("treats delicate-truth and awkward-text-fixer as aligned suggestions", () => {
    expect(toolsAlignWithIntent("delicate-truth", "awkward-text-fixer", sample)).toBe(true);
    expect(toolsAlignWithIntent("delicate-truth", "dating-roast", sample)).toBe(false);
  });
});
