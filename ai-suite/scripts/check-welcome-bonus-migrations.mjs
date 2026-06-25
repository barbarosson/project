#!/usr/bin/env node
/**
 * Verify welcome-bonus migrations are applied on the linked Supabase project.
 * Reads ai-suite/.env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ai-suite/.env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

function ok(label, detail = "") {
  console.log(`OK   ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail = "") {
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
}

function warn(label, detail = "") {
  console.log(`WARN ${label}${detail ? ` — ${detail}` : ""}`);
}

function rpcMissing(msg) {
  const m = String(msg || "").toLowerCase();
  return (
    m.includes("could not find the function") ||
    m.includes("function") && m.includes("does not exist") ||
    m.includes("schema cache") && m.includes("process_welcome_bonus")
  );
}

async function main() {
  console.log(`Project: ${url}\n`);

  // 1) Table isendai.welcome_bonus_grants (migration 20260604100000)
  const { error: tableErr, count } = await supabase
    .schema("isendai")
    .from("welcome_bonus_grants")
    .select("*", { count: "exact", head: true });

  if (tableErr) {
    fail("isendai.welcome_bonus_grants table", tableErr.message);
  } else {
    ok("isendai.welcome_bonus_grants table", `${count ?? 0} grant row(s)`);
  }

  // 2) Core billing RPCs (baseline)
  for (const [fn, args] of [
    [
      "ensure_entitlement",
      {
        p_owner_type: "user",
        p_owner_id: ZERO_UUID,
        p_default_credits: 0,
        p_default_max_versions: 9999,
      },
    ],
    ["add_credits", { p_owner_type: "user", p_owner_id: ZERO_UUID, p_amount: 1 }],
  ]) {
    const { error } = await supabase.rpc(fn, args);
    if (error && rpcMissing(error.message)) fail(`public.${fn} RPC`, error.message);
    else ok(`public.${fn} RPC`, error ? `callable (${error.message})` : "callable");
  }

  // 3) Welcome bonus RPCs
  const { error: rpcErr } = await supabase.rpc("process_welcome_bonus_for_user", {
    p_user_id: ZERO_UUID,
  });
  if (rpcErr && rpcMissing(rpcErr.message)) {
    fail("public.process_welcome_bonus_for_user RPC", rpcErr.message);
  } else {
    ok("public.process_welcome_bonus_for_user RPC", rpcErr ? `callable (${rpcErr.message})` : "callable");
  }

  const { data: backfillCount, error: backfillErr } = await supabase.rpc(
    "backfill_welcome_bonus_grants"
  );
  if (backfillErr && rpcMissing(backfillErr.message)) {
    fail("public.backfill_welcome_bonus_grants RPC", backfillErr.message);
  } else {
    ok(
      "public.backfill_welcome_bonus_grants RPC",
      backfillErr ? `callable (${backfillErr.message})` : `callable (last run count: ${backfillCount})`
    );
  }

  // 4) Trigger: query via pg_catalog if we can reach it through a helper RPC — fallback: infer from migration note
  // PostgREST cannot list triggers; check supabase_migrations if exposed
  const { data: migRows, error: migErr } = await supabase
    .schema("supabase_migrations")
    .from("schema_migrations")
    .select("version,name")
    .in("version", ["20260604100000", "20260605120000", "20260605130000"]);

  if (migErr) {
    warn(
      "supabase_migrations.schema_migrations",
      `not readable via API (${migErr.message}). Use Dashboard → Database → Migrations or SQL Editor.`
    );
  } else {
    const versions = new Set((migRows ?? []).map((r) => r.version));
    for (const v of ["20260604100000", "20260605120000"]) {
      if (versions.has(v)) ok(`migration ${v} recorded`);
      else fail(`migration ${v} recorded`, "not found in schema_migrations");
    }
    if (versions.has("20260605130000")) {
      ok("migration 20260605130000 recorded (account delete fix)");
    }
  }

  // 5) Sample: eligible users without grant (diagnostic)
  if (!tableErr) {
    const { data: grants, error: gErr } = await supabase
      .schema("isendai")
      .from("welcome_bonus_grants")
      .select("user_id,status,credits_tenths,created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (!gErr && grants?.length) {
      console.log("\nRecent welcome_bonus_grants:");
      for (const g of grants) {
        console.log(`  - ${g.user_id} | ${g.status} | ${g.credits_tenths} tenths | ${g.created_at}`);
      }
    } else if (!gErr) {
      console.log("\nNo welcome_bonus_grants rows yet (eligible users may not have completed profile + email).");
    }
  }

  console.log("\nTrigger check: open Supabase SQL Editor and run:");
  console.log(`  SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_verified';`);
  console.log("Expected: one row if migration 20260604100000+ applied.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
