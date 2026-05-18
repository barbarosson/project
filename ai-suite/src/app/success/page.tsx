import { Suspense } from "react";

import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import { SuccessClient } from "./success-client";

export default async function SuccessPage() {
  const authSnapshot = await readServerAuthSnapshot();
  return (
    <Suspense fallback={<div className="min-h-full bg-background" />}>
      <SuccessClient authSnapshot={authSnapshot} />
    </Suspense>
  );
}
