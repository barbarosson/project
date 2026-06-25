#!/usr/bin/env node
/**
 * Diagnose Supabase signup confirmation email setup.
 * Reads ai-suite/.env.local (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(envPath);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in ai-suite/.env.local");
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function ok(label, detail = "") {
  console.log(`OK   ${label}${detail ? ` — ${detail}` : ""}`);
}
function fail(label, detail = "") {
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
}
function warn(label, detail = "") {
  console.log(`WARN ${label}${detail ? ` — ${detail}` : ""}`);
}

async function fetchAuthSettings() {
  const res = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!res.ok) {
    fail("GET /auth/v1/settings", `${res.status} ${await res.text()}`);
    return null;
  }
  return res.json();
}

async function main() {
  console.log(`Project: ${url}`);
  console.log(`NEXT_PUBLIC_SITE_URL: ${siteUrl || "(not set)"}\n`);

  const settings = await fetchAuthSettings();
  if (settings) {
    const mailerAutoconfirm = settings.mailer_autoconfirm;
    const disableSignup = settings.disable_signup;
    const externalEmail = settings.external?.email;
    const emailEnabled = externalEmail?.enabled;
    const secureEmailChange = settings.secure_email_change_enabled;

    console.log("Auth settings (public):");
    console.log(`  mailer_autoconfirm: ${mailerAutoconfirm}`);
    console.log(`  disable_signup: ${disableSignup}`);
    console.log(`  external.email.enabled: ${emailEnabled}`);
    console.log(`  secure_email_change_enabled: ${secureEmailChange}`);

    if (mailerAutoconfirm === true) {
      warn(
        "Email confirmation",
        "mailer_autoconfirm=true → Supabase does NOT send confirmation emails; users get a session immediately."
      );
    } else if (mailerAutoconfirm === false) {
      ok("Email confirmation required", "mailer_autoconfirm=false → confirmation emails should be sent");
    }

    if (emailEnabled === false) {
      fail("Email provider", "external.email.enabled=false → auth emails disabled");
    } else {
      ok("Email provider enabled", String(emailEnabled));
    }
  }

  const testEmail = `diag-${Date.now()}@example.com`;
  const redirectTo = siteUrl
    ? `${siteUrl.replace(/\/+$/, "")}/auth/callback?next=%2F`
    : "http://localhost:3000/auth/callback?next=%2F";

  console.log(`\nTest signUp (no real inbox): ${testEmail}`);
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: "DiagTest123!x",
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    fail("signUp API", error.message);
  } else {
    const hasSession = Boolean(data.session);
    const identities = data.user?.identities?.length ?? 0;
    const confirmed = data.user?.email_confirmed_at ?? null;
    console.log(`  session returned: ${hasSession}`);
    console.log(`  identities count: ${identities}`);
    console.log(`  email_confirmed_at: ${confirmed ?? "null"}`);
    console.log(`  user id: ${data.user?.id ?? "n/a"}`);

    if (hasSession) {
      warn("signUp", "Session returned without email confirm — autoconfirm likely ON");
    } else if (identities === 0) {
      warn("signUp", "Empty identities — duplicate email pattern (no mail sent)");
    } else {
      ok("signUp", "No session, identities present — Supabase accepted signup (mail queue is server-side)");
    }
  }

  console.log("\nDashboard checks (manual):");
  console.log("  Authentication → URL Configuration → Redirect URLs must include:");
  console.log("    https://isendai.com/auth/callback*");
  console.log("    https://www.isendai.com/auth/callback*");
  console.log("    http://localhost:3000/auth/callback* (dev)");
  console.log("  Authentication → Email → SMTP / rate limits / Auth logs");
  console.log("  Project Settings → Auth → Confirm email must be ON for confirmation mails");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
