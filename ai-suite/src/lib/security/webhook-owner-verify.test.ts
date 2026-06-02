import { describe, expect, it } from "vitest";

import { lemonCustomerEmailFromAttributes } from "@/lib/security/webhook-owner-verify";

describe("lemonCustomerEmailFromAttributes", () => {
  it("reads user_email", () => {
    expect(lemonCustomerEmailFromAttributes({ user_email: "A@B.com" })).toBe("a@b.com");
  });

  it("reads nested customer.email", () => {
    expect(
      lemonCustomerEmailFromAttributes({ customer: { email: "pay@example.com" } })
    ).toBe("pay@example.com");
  });

  it("returns null when missing", () => {
    expect(lemonCustomerEmailFromAttributes({})).toBeNull();
  });
});
