import { describe, expect, it } from "vitest";

import {
  billableChunks500,
  creditsForGeneration,
  CREDIT_CHUNK_CHAR_LENGTH,
} from "./models";

describe("billableChunks500", () => {
  it("counts empty input as one chunk", () => {
    expect(billableChunks500(0)).toBe(1);
  });

  it("rounds up to 500-character chunks", () => {
    expect(billableChunks500(1)).toBe(1);
    expect(billableChunks500(CREDIT_CHUNK_CHAR_LENGTH)).toBe(1);
    expect(billableChunks500(CREDIT_CHUNK_CHAR_LENGTH + 1)).toBe(2);
  });
});

describe("creditsForGeneration", () => {
  it("charges economy tier and gpt-4o-mini at 1 credit per chunk", () => {
    expect(creditsForGeneration("gpt-4o-mini", 500)).toBe(1);
    expect(creditsForGeneration("gpt-4o-mini", 501)).toBe(2);
    expect(creditsForGeneration("deepseek-chat", 500)).toBe(1);
  });

  it("charges standard tier at 15 credits per chunk", () => {
    expect(creditsForGeneration("claude-haiku-4-5", 500)).toBe(15);
    expect(creditsForGeneration("claude-haiku-4-5", 501)).toBe(30);
  });

  it("charges premium tier at 25 credits per chunk", () => {
    expect(creditsForGeneration("gpt-4o", 500)).toBe(25);
    expect(creditsForGeneration("gpt-4o", 501)).toBe(50);
  });
});
