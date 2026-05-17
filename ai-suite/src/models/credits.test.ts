import { describe, expect, it } from "vitest";

import {
  billableBlocks100,
  billableChunks500,
  creditsForGeneration,
  CREDIT_BILL_CHAR_LENGTH,
  CREDIT_CHUNK_CHAR_LENGTH,
} from "./models";

describe("billableBlocks100", () => {
  it("counts empty input as one block", () => {
    expect(billableBlocks100(0)).toBe(1);
  });

  it("rounds up to 100-character blocks", () => {
    expect(billableBlocks100(1)).toBe(1);
    expect(billableBlocks100(CREDIT_BILL_CHAR_LENGTH)).toBe(1);
    expect(billableBlocks100(CREDIT_BILL_CHAR_LENGTH + 1)).toBe(2);
  });
});

describe("billableChunks500 (legacy)", () => {
  it("rounds up to 500-character chunks", () => {
    expect(billableChunks500(CREDIT_CHUNK_CHAR_LENGTH)).toBe(1);
    expect(billableChunks500(CREDIT_CHUNK_CHAR_LENGTH + 1)).toBe(2);
  });
});

describe("creditsForGeneration (tenths)", () => {
  it("charges economy tier and gpt-4o-mini at 0.2 credits per 100 chars", () => {
    expect(creditsForGeneration("gpt-4o-mini", 100)).toBe(2);
    expect(creditsForGeneration("gpt-4o-mini", 500)).toBe(10);
    expect(creditsForGeneration("gpt-4o-mini", 501)).toBe(12);
    expect(creditsForGeneration("deepseek-chat", 250)).toBe(6);
  });

  it("charges standard tier at 3 credits per 100 chars", () => {
    expect(creditsForGeneration("claude-haiku-4-5", 500)).toBe(150);
    expect(creditsForGeneration("claude-haiku-4-5", 501)).toBe(180);
    expect(creditsForGeneration("claude-haiku-4-5", 800)).toBe(240);
  });

  it("charges premium tier at 5 credits per 100 chars", () => {
    expect(creditsForGeneration("gpt-4o", 500)).toBe(250);
    expect(creditsForGeneration("gpt-4o", 501)).toBe(300);
    expect(creditsForGeneration("gpt-4o", 250)).toBe(150);
  });
});
