import type { Provider } from "@supabase/auth-js";

import { cn } from "@/lib/utils";

type IconProps = { className?: string };

/** Icon for Supabase OAuth provider id (Apple, X, LinkedIn OIDC, custom TikTok). */
export function OauthProviderMark({ provider, className }: IconProps & { provider: Provider }) {
  const id = String(provider);
  if (id === "apple") return <AppleMark className={className} />;
  if (id === "x") return <XMark className={className} />;
  if (id === "linkedin_oidc") return <LinkedInMark className={className} />;
  if (id.includes("tiktok")) return <TikTokMark className={className} />;
  return null;
}

/** Google “G” mark (brand colors). */
export function GoogleMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0", className)}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/** Facebook “f” on brand blue circle. */
export function FacebookMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0", className)}
      aria-hidden
      focusable="false"
    >
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.6 16.5v-5.3h1.8l.27-2.05H13.6V8.25c0-.6.17-1 1.05-1h1.15V5.35h-1.85c-2.05 0-3.35 1.25-3.35 3.55v1.45H9v2.05h1.6v5.15h3z"
      />
    </svg>
  );
}

/** Apple logo (monochrome). */
export function AppleMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0 fill-current", className)}
      aria-hidden
      focusable="false"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

/** X (Twitter) logo. */
export function XMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0 fill-current", className)}
      aria-hidden
      focusable="false"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** LinkedIn “in” mark. */
export function LinkedInMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0", className)}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

/** TikTok note (single-path glyph; reads clearly on dark buttons). */
export function TikTokMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0 fill-white", className)}
      aria-hidden
      focusable="false"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}
