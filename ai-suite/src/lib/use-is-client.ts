"use client";

import * as React from "react";

/** Client-only render guard without setState in useEffect (SSR-safe for portals). */
export function useIsClient(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
