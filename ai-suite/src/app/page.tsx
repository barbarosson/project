import { HomeClient } from "@/app/home-client";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "isendai | Perfect Your Message Before You Hit Send",
  description:
    "Stop overthinking. Let AI transform your angry emails, write your cover letters, and handle your communication stress in seconds. Pay per use, no subscriptions.",
};

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-full bg-background" />}>
      <HomeClient />
    </Suspense>
  );
}
