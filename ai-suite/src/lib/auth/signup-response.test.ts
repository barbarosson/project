import { describe, expect, it } from "vitest";

import { signupLikelyExistingAccount } from "@/lib/auth/signup-response";

describe("signupLikelyExistingAccount", () => {
  it("returns true for empty identities", () => {
    expect(signupLikelyExistingAccount({ identities: [] } as never)).toBe(true);
  });

  it("returns true when created_at is older than the re-signup window", () => {
    const twoMinutesAgo = new Date(Date.now() - 120_000).toISOString();
    expect(
      signupLikelyExistingAccount({
        created_at: twoMinutesAgo,
        identities: [{ provider: "email" }],
      } as never)
    ).toBe(true);
  });

  it("returns false for a fresh signup response", () => {
    expect(
      signupLikelyExistingAccount({
        created_at: new Date().toISOString(),
        identities: [{ provider: "email" }],
      } as never)
    ).toBe(false);
  });
});
