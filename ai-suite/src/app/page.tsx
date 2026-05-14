import { Suspense } from "react";
import type { Metadata } from "next";

import { HomeClient } from "@/app/home-client";
import type { HomeCreditsSnapshot } from "@/app/home-credits-snapshot";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import { getOrCreateAnonId } from "@/lib/isendai/owner";
import { readUserEntitlementWalletFromSession } from "@/lib/isendai/user-wallet-from-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "isendai | Perfect Your Message Before You Hit Send",
  description:
    "Stop overthinking. Let AI transform your angry emails, write your cover letters, and handle your communication stress in seconds. Pay per use, no subscriptions.",
};

export default async function Home() {
  let creditsSnapshot: HomeCreditsSnapshot | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const ownerId = auth.user?.id ?? (await getOrCreateAnonId());

    if (auth.user) {
      const w = await readUserEntitlementWalletFromSession(supabase);
      if (w && w !== "rpc_missing") {
        creditsSnapshot = {
          balance: Number(w.credits_balance ?? 0),
          maxVersions: Number(w.max_versions_per_request ?? 5) || 5,
          owner: "user",
        };
      } else {
        const admin = createSupabaseAdminClientOrNull();
        if (!admin) {
          creditsSnapshot = null;
        } else {
          const { data: ent } = await admin
            .schema("isendai")
            .from("entitlements")
            .select("credits_balance,max_versions_per_request")
            .eq("owner_type", "user")
            .eq("owner_id", String(ownerId).trim())
            .maybeSingle();
          creditsSnapshot = {
            balance: ent?.credits_balance ?? 0,
            maxVersions: ent?.max_versions_per_request ?? 5,
            owner: "user",
          };
        }
      }
    } else {
      const admin = createSupabaseAdminClientOrNull();
      if (!admin) {
        creditsSnapshot = null;
      } else {
        const { data: ent } = await admin
          .schema("isendai")
          .from("entitlements")
          .select("credits_balance,max_versions_per_request")
          .eq("owner_type", "anon")
          .eq("owner_id", ownerId)
          .maybeSingle();
        creditsSnapshot = {
          balance: ent?.credits_balance ?? 0,
          maxVersions: ent?.max_versions_per_request ?? 2,
          owner: "anon",
        };
      }
    }
  } catch {
    creditsSnapshot = null;
  }

  return (
    <Suspense fallback={<div className="min-h-full bg-background" />}>
      <HomeClient creditsSnapshot={creditsSnapshot} />
    </Suspense>
  );
}
