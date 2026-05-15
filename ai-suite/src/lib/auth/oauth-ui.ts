/**
 * Which OAuth providers appear on /login. Code for hidden providers stays in repo;
 * flip flags when ready to ship (or use env in CI later).
 */
export const OAUTH_UI = {
  google: true,
  facebook: true,
  instagram: false,
  /** Apple, X, LinkedIn, TikTok, etc. */
  other: false,
} as const;
