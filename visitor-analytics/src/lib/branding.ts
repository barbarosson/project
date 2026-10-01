/** White-label branding helpers for client/share views. */

export type OrgBrand = {
  name: string;
  brandLogoUrl: string | null;
  brandDisplayName: string | null;
};

export function brandDisplayName(org: OrgBrand): string {
  const custom = org.brandDisplayName?.trim();
  return custom || org.name;
}

export function brandLogoUrl(org: OrgBrand): string | null {
  const url = org.brandLogoUrl?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
