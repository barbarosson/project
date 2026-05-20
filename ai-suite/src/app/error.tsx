"use client";

import { ErrorContent } from "./error-content";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorContent reset={reset} digest={error.digest} />;
}
