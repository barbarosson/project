import { HomeClient } from "@/app/home-client";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-full bg-background" />}>
      <HomeClient />
    </Suspense>
  );
}
