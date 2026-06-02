import { describe, expect, it } from "vitest";

import { modelSupportsTemperature, withOptionalTemperature } from "./generation-sampling";

describe("modelSupportsTemperature", () => {
  it("disables temperature for OpenAI reasoning models", () => {
    expect(modelSupportsTemperature("o1")).toBe(false);
    expect(modelSupportsTemperature("o1-mini")).toBe(false);
    expect(modelSupportsTemperature("o3-mini")).toBe(false);
  });

  it("allows temperature for standard chat models", () => {
    expect(modelSupportsTemperature("gpt-4o-mini")).toBe(true);
    expect(modelSupportsTemperature("claude-sonnet-4-6")).toBe(true);
  });
});

describe("withOptionalTemperature", () => {
  it("omits temperature for unsupported models", () => {
    expect(withOptionalTemperature("o3-mini", 0.6)).toEqual({});
  });

  it("includes temperature for supported models", () => {
    expect(withOptionalTemperature("gpt-4o-mini", 0.6)).toEqual({ temperature: 0.6 });
  });
});
