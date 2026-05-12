import crypto from "crypto";

/** One subscription trial per authenticated owner (server-side guard). */
export function trialOwnerFingerprint(ownerType: string, ownerId: string): string {
  return crypto.createHash("sha256").update(`${ownerType}:${ownerId}`, "utf8").digest("hex");
}

/** Optional stricter key including client IP (checkout preflight). */
export function trialNetworkFingerprint(ownerType: string, ownerId: string, request: Request): string {
  const fwd = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";
  const ip = fwd.split(",")[0]?.trim() || "unknown";
  return crypto.createHash("sha256").update(`${ownerType}:${ownerId}:${ip}`, "utf8").digest("hex");
}
