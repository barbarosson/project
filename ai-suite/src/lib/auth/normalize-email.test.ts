import { describe, expect, it } from "vitest";

import {
  fixCommonAuthEmailTypos,
  isPlausibleAuthEmail,
  normalizeEmailForAuth,
  prepareEmailForAuth,
} from "@/lib/auth/normalize-email";

describe("normalizeEmailForAuth", () => {
  it("normalizes valid corporate email", () => {
    expect(normalizeEmailForAuth("  Info@ModulusTech.app  ")).toBe("info@modulustech.app");
  });

  it("accepts modulustech.app addresses", () => {
    expect(isPlausibleAuthEmail("info@modulustech.app")).toBe(true);
  });

  it("fixes modulsutech.app typo", () => {
    expect(prepareEmailForAuth("info@modulsutech.app")).toBe("info@modulustech.app");
    expect(fixCommonAuthEmailTypos("info@modulsutech.app")).toBe("info@modulustech.app");
  });
});
