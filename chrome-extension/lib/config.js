/** @typedef {"production" | "staging"} ApiEnv */

/** @type {ApiEnv} */
export const API_ENV = "production";

const ORIGINS = {
  production: "https://isendai.com",
  staging: "https://isendai.netlify.app",
};

export function apiOrigin() {
  return ORIGINS[API_ENV] ?? ORIGINS.production;
}

export function apiUrl(path) {
  const base = apiOrigin().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export const LOGIN_URL = `${apiOrigin()}/login`;
export const PRICING_URL = `${apiOrigin()}/pricing`;

/** Default tool for free-form “fix my message” from Gmail, LinkedIn, X, etc. */
export const DEFAULT_TOOL = "corporate-whisperer";

export const MODEL_OPTIONS = [
  { id: "fast-ai", label: "Fast AI", credits: 1 },
  { id: "pro-ai", label: "Pro AI", credits: 25 },
];
