import { reportServerError } from "@/lib/observability/report-error";

export async function onRequestError(
  error: Error & { digest?: string },
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string }
): Promise<void> {
  await reportServerError({
    message: error.message,
    digest: error.digest,
    scope: "onRequestError",
    path: `${request.method} ${request.path} (${context.routePath})`,
    stack: error.stack,
  });
}
