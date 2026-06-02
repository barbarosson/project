import { describe, expect, it } from "vitest";

import {
  normalizeUserModelId,
  parseRequestedModelId,
  resolveConcreteModelId,
} from "./models";

describe("parseRequestedModelId", () => {
  it("preserves concrete catalog ids", () => {
    expect(parseRequestedModelId("gemini-2.5-pro")).toBe("gemini-2.5-pro");
    expect(parseRequestedModelId("o3-mini")).toBe("o3-mini");
  });

  it("maps auto and tiers", () => {
    expect(parseRequestedModelId("auto")).toBe("auto");
    expect(parseRequestedModelId("pro-ai")).toBe("pro-ai");
  });

  it("resolves legacy aliases", () => {
    expect(parseRequestedModelId("claude-3-5-sonnet-latest")).toBe("claude-sonnet-4-6");
  });
});

describe("resolveConcreteModelId", () => {
  it("uses pro tier flagship from config", () => {
    expect(resolveConcreteModelId("pro-ai")).toBe("claude-sonnet-4-6");
  });

  it("honors explicit concrete model for generation", () => {
    expect(resolveConcreteModelId("llama-3.3-70b-versatile")).toBe("llama-3.3-70b-versatile");
    expect(resolveConcreteModelId(normalizeUserModelId("gpt-4o"))).toBe("gpt-4o");
  });
});
