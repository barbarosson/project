#!/usr/bin/env node
/**
 * Service role ile kullanıcıya kontör ekle veya bakiyeyi ayarla.
 *
 * Bakiye isendai.entitlements.credits_balance içinde "tenths" olarak tutulur:
 *   1 görünen kontör = 10 tenths  (ör. 50 kontör eklemek → +500 tenths)
 *
 * Ortam (PowerShell örneği):
 *   cd ai-suite
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *
 * E-posta ile ekleme:
 *   node scripts/admin-add-credits.mjs email="user@example.com" credits=50
 *
 * UUID ile ekleme:
 *   node scripts/admin-add-credits.mjs user-id="f873cde8-627a-48ab-beaf-4a8ca045b2b6" credits=100
 *
 * Mutlak bakiye ayarlama (ekleme değil):
 *   node scripts/admin-add-credits.mjs email="user@example.com" set-credits=25
 *
 * Önizleme (DB'ye yazmaz):
 *   node scripts/admin-add-credits.mjs email="user@example.com" credits=50 dry-run=1
 *
 * İsteğe bağlı: max-versions=9999 (ensure_entitlement için)
 */

import { createClient } from "@supabase/supabase-js";

const TENTHS_PER_CREDIT = 10;

function parseArgs(argv) {
  const out = {};
  const allowed = new Set([
    "email",
    "user-id",
    "userid",
    "credits",
    "credit",
    "set-credits",
    "set-credit",
    "max-versions",
    "dry-run",
    "dryrun",
  ]);
  for (const raw of argv) {
    if (raw === "--") continue;
    const eq = raw.indexOf("=");
    if (eq === -1) continue;
    let key = raw.slice(0, eq).trim();
    const val = raw.slice(eq + 1);
    if (key.startsWith("--")) key = key.slice(2);
    if (key === "userid") key = "user-id";
    if (key === "credit") key = "credits";
    if (key === "set-credit") key = "set-credits";
    if (key === "dryrun") key = "dry-run";
    if (!key || !allowed.has(key)) continue;
    out[key] = val;
  }
  return out;
}

function creditsToTenths(wholeCredits) {
  const n = Number.parseFloat(String(wholeCredits).trim());
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * TENTHS_PER_CREDIT);
}

function formatCreditsFromTenths(tenths) {
  const n = Math.max(0, Math.floor(Number(tenths) || 0));
  if (n % TENTHS_PER_CREDIT === 0) return String(n / TENTHS_PER_CREDIT);
  const s = (n / TENTHS_PER_CREDIT).toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

async function findUserIdByEmail(admin, email) {
  let page = 1;
  const perPage = 200;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return { id: found.id, email: found.email ?? email };
    if (!data.users.length || data.users.length < perPage) break;
    page += 1;
  }
  throw new Error(`Kullanıcı bulunamadı: ${email}`);
}

async function readBalance(admin, userId) {
  const { data, error } = await admin
    .schema("isendai")
    .from("entitlements")
    .select("credits_balance, max_versions_per_request")
    .eq("owner_type", "user")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    const msg = String(error.message || "").toLowerCase();
    if (msg.includes("invalid schema") || msg.includes("does not exist")) {
      return { balanceTenths: null, maxVersions: null, schemaError: error.message };
    }
    throw error;
  }

  return {
    balanceTenths: data?.credits_balance ?? null,
    maxVersions: data?.max_versions_per_request ?? null,
    schemaError: null,
  };
}

function printUsage() {
  console.error(`
Kullanım:
  node scripts/admin-add-credits.mjs email="user@example.com" credits=50
  node scripts/admin-add-credits.mjs user-id="UUID" credits=50
  node scripts/admin-add-credits.mjs email="user@example.com" set-credits=100

Argümanlar:
  email=          Kullanıcı e-postası (email veya user-id zorunlu)
  user-id=        auth.users UUID
  credits=        Eklenecek kontör (görünen birim; 50 = 50 kontör)
  set-credits=    Bakiyeyi bu değere ayarla (ekleme yerine)
  max-versions=   Yeni entitlement satırı için (varsayılan 9999)
  dry-run=1       Sadece önizleme, yazma yok

Ortam: NEXT_PUBLIC_SUPABASE_URL (veya SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
`.trim());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args["dry-run"] === "1" || args["dry-run"] === "true";

  const email = args.email?.trim();
  const userIdArg = args["user-id"]?.trim();

  if (!email && !userIdArg) {
    printUsage();
    process.exit(1);
  }

  const hasAdd = args.credits !== undefined && args.credits !== "";
  const hasSet = args["set-credits"] !== undefined && args["set-credits"] !== "";

  if (hasAdd === hasSet) {
    console.error("Tam olarak biri gerekli: credits=N (ekle) veya set-credits=N (ayarla).");
    process.exit(1);
  }

  const displayAmount = hasAdd ? args.credits : args["set-credits"];
  const tenths = creditsToTenths(displayAmount);
  if (!Number.isFinite(tenths) || tenths < 0) {
    console.error("Geçersiz kontör değeri. Örnek: credits=50 veya set-credits=12.5");
    process.exit(1);
  }
  if (hasAdd && tenths <= 0) {
    console.error("Eklenecek credits pozitif olmalı.");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Ortam: NEXT_PUBLIC_SUPABASE_URL (veya SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId = userIdArg;
  let userEmail = email ?? null;
  if (!userId && email) {
    const found = await findUserIdByEmail(admin, email);
    userId = found.id;
    userEmail = found.email;
  }

  console.log("Kullanıcı:", userEmail ?? "(e-posta yok)", "| user_id:", userId);

  const before = await readBalance(admin, userId);
  if (before.schemaError) {
    console.warn("Not: isendai şeması REST ile okunamadı; RPC sonrası bakiye dönecek.", before.schemaError);
  } else if (before.balanceTenths !== null) {
    console.log("Mevcut bakiye:", formatCreditsFromTenths(before.balanceTenths), "kontör");
  } else {
    console.log("Mevcut bakiye: (henüz entitlement satırı yok)");
  }

  const maxVersionsRaw = args["max-versions"];
  const maxVersions = maxVersionsRaw
    ? Number.parseInt(String(maxVersionsRaw).trim(), 10)
    : 9999;

  const actionLabel = hasAdd
    ? `+${formatCreditsFromTenths(tenths)} kontör (+${tenths} tenths)`
    : `bakiye → ${formatCreditsFromTenths(tenths)} kontör (${tenths} tenths)`;

  console.log("İşlem:", actionLabel);
  if (dryRun) {
    console.log("dry-run: veritabanına yazılmadı.");
    return;
  }

  const { error: entErr } = await admin.rpc("ensure_entitlement", {
    p_owner_type: "user",
    p_owner_id: userId,
    p_default_credits: 0,
    p_default_max_versions: Number.isFinite(maxVersions) ? maxVersions : 9999,
  });
  if (entErr) throw entErr;

  if (hasAdd) {
    const { data: newBal, error: addErr } = await admin.rpc("add_credits", {
      p_owner_type: "user",
      p_owner_id: userId,
      p_amount: tenths,
    });
    if (addErr) throw addErr;
    console.log("Tamam. Yeni bakiye:", formatCreditsFromTenths(newBal), "kontör", `(${newBal} tenths)`);
    return;
  }

  const { error: setErr } = await admin.rpc("set_credits_balance", {
    p_owner_type: "user",
    p_owner_id: userId,
    p_balance: tenths,
  });
  if (setErr) throw setErr;

  const after = await readBalance(admin, userId);
  const finalTenths = after.balanceTenths ?? tenths;
  console.log("Tamam. Yeni bakiye:", formatCreditsFromTenths(finalTenths), "kontör", `(${finalTenths} tenths)`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
