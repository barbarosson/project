import { Suspense } from "react";
import { SuccessClient } from "./success-client";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-full bg-background" />}>
      <SuccessClient />
    </Suspense>
  );
}

