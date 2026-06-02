import { redirect } from "next/navigation";

import { normalizeReferralCode } from "@/lib/referrals/code";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const sp = await searchParams;
  const ref = normalizeReferralCode(sp.ref);
  const params = new URLSearchParams();
  if (ref) params.set("ref", ref);
  const qs = params.toString();
  redirect(qs ? `/login?${qs}` : "/login");
}
