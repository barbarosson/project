#!/usr/bin/env node
/**
 * Checks required Netlify env keys for isendai launch (names only — no secret values).
 * Usage: node scripts/verify-launch-env.mjs production|staging
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const REQUIRED = {
  production: [
    "NEXT_PUBLIC_DEPLOY_ENV",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "LEMON_SQUEEZY_API_KEY",
    "LEMON_SQUEEZY_STORE_ID",
    "LEMONSQUEEZY_WEBHOOK_SECRET",
    "LEMON_SQUEEZY_VARIANT_BASIC_MONTHLY",
    "LEMON_SQUEEZY_VARIANT_PRO_MONTHLY",
    "LEMON_SQUEEZY_VARIANT_ULTRA_MONTHLY",
  ],
  staging: [
    "NEXT_PUBLIC_DEPLOY_ENV",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_PRODUCTION_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
  ],
};

const OPTIONAL = [
  "NEXT_PUBLIC_GA_ID",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
  "ERROR_WEBHOOK_URL",
];

const mode = process.argv[2]?.trim().toLowerCase();
if (mode !== "production" && mode !== "staging") {
  console.error("Usage: node scripts/verify-launch-env.mjs <production|staging>");
  process.exit(1);
}

const examplePath = resolve(root, mode === "production" ? ".env.production.example" : ".env.staging.example");
const example = readFileSync(examplePath, "utf8");
const documented = new Set(
  [...example.matchAll(/^([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1])
);

const missingDoc = REQUIRED[mode].filter((k) => !documented.has(k) && !readFileSync(resolve(root, "env.example"), "utf8").includes(`${k}=`));
if (missingDoc.length) {
  console.warn("Warning: keys not documented in env.example:", missingDoc.join(", "));
}

const unset = REQUIRED[mode].filter((k) => !process.env[k]?.trim());
if (unset.length) {
  console.error(`[${mode}] Missing env vars in this shell:\n  - ${unset.join("\n  - ")}`);
  console.error("\nSet them in Netlify → Environment variables, then redeploy.");
  process.exit(1);
}

console.log(`[${mode}] Required env vars present in this shell (${REQUIRED[mode].length}).`);
const unsetOpt = OPTIONAL.filter((k) => !process.env[k]?.trim());
if (unsetOpt.length) {
  console.log("Optional (not set):", unsetOpt.join(", "));
}
process.exit(0);
