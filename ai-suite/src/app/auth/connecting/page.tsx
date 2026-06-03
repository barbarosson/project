import { cookies } from "next/headers";
import { Suspense } from "react";

import { SitePageChrome, SitePageHeader, SitePageMain } from "@/components/site-page-layout";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";

import { OAuthConnectingClient } from "./connecting-client";

export const dynamic = "force-dynamic";

export default async function OAuthConnectingPage() {
  const authSnapshot = await readServerAuthSnapshot();

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="auth">
        <Suspense fallback={null}>
          <OAuthConnectingClient />
        </Suspense>
      </SitePageMain>
    </SitePageChrome>
  );
}
