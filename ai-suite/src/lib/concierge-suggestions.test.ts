import { describe, expect, it } from "vitest";

import { finalizeConciergeSuggestions } from "@/lib/concierge-suggestions";

describe("finalizeConciergeSuggestions", () => {
  const lastUser =
    "beğendiğim bir insan var ona çıkma teklif etmek istiyorum bana yardımcı olur musun";

  it("matches bottom chips to tools named in reply (not extra LLM ids)", () => {
    const reply =
      "İlk olarak, Garip Metin Düzeltici ile teklifini daha akıcı yapabilirsin. " +
      "Alternatif olarak, Hassas Gerçek aracıyla duygularını nazikçe ifade edebilirsin.";
    const labels: Record<string, string> = {
      "awkward-text-fixer": "Garip Metin Düzeltici",
      "delicate-truth": "Hassas Gerçek",
      "relationship-repair-text": "İlişki Onarım Metni",
    };
    const out = finalizeConciergeSuggestions(
      lastUser,
      reply,
      ["awkward-text-fixer", "delicate-truth", "relationship-repair-text"],
      (t) => labels[t] ?? t
    );
    expect(out).toEqual(["awkward-text-fixer", "delicate-truth"]);
  });

  it("prefers markdown links when present", () => {
    const reply =
      "Şunları dene:\n- [😅 Garip Metin Düzeltici](/?tool=awkward-text-fixer)\n- [🫧 Hassas Gerçek](/?tool=delicate-truth)";
    const out = finalizeConciergeSuggestions(lastUser, reply, ["relationship-repair-text"], () => "");
    expect(out).toEqual(["awkward-text-fixer", "delicate-truth"]);
  });
});
