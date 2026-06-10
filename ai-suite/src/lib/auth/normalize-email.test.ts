import { describe, expect, it } from "vitest";

import { isPlausibleAuthEmail, normalizeEmailForAuth } from "@/lib/auth/normalize-email";

describe("normalizeEmailForAuth", () => {
  it("normalizes valid corporate email", () => {
    expect(normalizeEmailForAuth("  Info@ModulusTech.app  ")).toBe("info@modulustech.app");
  });

  it("accepts modulustech.app addresses", () => {
    expect(isPlausibleAuthEmail("info@modulustech.app")).toBe(true);
  });
});
