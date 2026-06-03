import { Suspense } from "react";

import { SitePageChrome, SitePageHeader, SitePageMain } from "@/components/site-page-layout";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";

import { OAuthCompletingClient } from "./completing-client";

export const dynamic = "force-dynamic";

export default async function OAuthCompletingPage() {
  const authSnapshot = await readServerAuthSnapshot();

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="auth">
        <Suspense fallback={null}>
          <OAuthCompletingClient />
        </Suspense>
      </SitePageMain>
    </SitePageChrome>
  );
}
