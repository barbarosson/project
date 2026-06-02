"use client";

import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";

export function PwaSerwistProvider({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV !== "production"}>
      {children}
    </SerwistProvider>
  );
}
