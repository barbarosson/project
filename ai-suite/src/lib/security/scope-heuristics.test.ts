import { describe, expect, it } from "vitest";

import { scopeByHeuristicsOnly } from "@/lib/security/scope-heuristics";

describe("scopeByHeuristicsOnly", () => {
  it("blocks very short input", () => {
    const r = scopeByHeuristicsOnly("corporate-whisperer", "hi");
    expect(r.in_scope).toBe(false);
  });

  it("allows when tool is in top intent matches", () => {
    const text = "I need to write a professional email to my boss about a deadline";
    const r = scopeByHeuristicsOnly("corporate-whisperer", text);
    expect(r.in_scope).toBe(true);
  });

  it("suggests another tool when intent mismatches", () => {
    const text = "What gift should I ask my girlfriend for her birthday?";
    const r = scopeByHeuristicsOnly("corporate-whisperer", text);
    expect(r.in_scope).toBe(false);
    expect(r.suggested_tool).toBeTruthy();
  });
});
