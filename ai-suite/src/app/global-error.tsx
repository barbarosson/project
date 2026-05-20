"use client";

import * as React from "react";
import Link from "next/link";

import { reportClientError } from "@/lib/observability/report-error";

/** Shown when the root layout fails; cannot rely on app providers or i18n. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    void reportClientError({
      message: error.message || "global_error",
      digest: error.digest,
      scope: "global_error",
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 font-sans text-slate-50 antialiased">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-400">
            A critical error occurred. You can try again or return to the home page.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Back to home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
