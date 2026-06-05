function trimUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, "") : undefined;
}

/** MODULUS LinkedIn company page — shown in isendai footer when configured. */
export function getModulusLinkedInUrl(): string | undefined {
  return trimUrl(process.env.NEXT_PUBLIC_MODULUS_LINKEDIN_URL);
}
