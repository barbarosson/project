/**
 * Server/runtime error hook (Next.js instrumentation).
 * Optional Sentry can be wired here later via SENTRY_DSN.
 */
export async function onRequestError(
  error: Error & { digest?: string },
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string }
): Promise<void> {
  console.error("[isendai]", {
    route: context.routePath,
    routerKind: context.routerKind,
    method: request.method,
    path: request.path,
    message: error.message,
    digest: error.digest,
  });
}
