import { clientIpFromRequest } from "@/lib/rate-limit";

export function referralIpFromRequest(req: Request): string {
  return clientIpFromRequest(req);
}

export function deviceFingerprintFromRequest(req: Request): string | null {
  const raw = req.headers.get("x-isendai-device-fp")?.trim();
  if (!raw) return null;
  return raw.slice(0, 128);
}
