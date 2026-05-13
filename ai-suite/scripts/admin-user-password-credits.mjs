#!/usr/bin/env node
/**
 * Service role ile: şifre güncelle + isendai kontör ekle.
 *
 * Kullanım (PowerShell — her arg tek tırnaklı key=value; @ ve boşluk güvenli):
 *   cd ai-suite
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node scripts/admin-user-password-credits.mjs 'email=u@x.com' 'password=***' 'credits=50'
 *
 * Not: credits=50 olmadan çalıştırırsanız yalnızca şifre güncellenir; kredi eklenmez.
 *
 * Sadece kontör:
 *   node scripts/admin-user-password-credits.mjs --email="user@site.com" --credits=100
 *
 * Sadece şifre:
 *   node scripts/admin-user-password-credits.mjs --email="user@site.com" --password="YeniSifre123"
 *
 * Ortam değişkenleri: NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_URL; SUPABASE_SERVICE_ROLE_KEY zorunlu.
 */

import { createClient } from "@supabase/supabase-js";

function parseArgs(argv) {
  const out = {};
  const allowed = new Set(["email", "password", "credits", "credit", "max-versions"]);
  for (const raw of argv) {
    if (raw === "--") continue;
    const eq = raw.indexOf("=");
    if (eq === -1) continue;
    let key = raw.slice(0, eq).trim();
    const val = raw.slice(eq + 1);
    if (key.startsWith("--")) key = key.slice(2);
    if (!key || !allowed.has(key)) continue;
    if (key === "credit") key = "credits";
    out[key] = val;
  }
  return out;
}

async function findUserIdByEmail(admin, email) {
  let page = 1;
  const perPage = 200;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (!data.users.length || data.users.length < perPage) break;
    page += 1;
  }
  throw new Error(`Kullanıcı bulunamadı: ${email}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email;
  const password = args.password;
  const creditsRaw = args.credits;

  if (!email) {
    console.error('Eksik: email=... veya --email="..." (ör. email="a@b.com" password="..." credits=50)');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Ortam: NEXT_PUBLIC_SUPABASE_URL (veya SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userId = await findUserIdByEmail(supabase, email);
  console.log("user_id:", userId);

  const parsedKeys = Object.keys(args).filter((k) => k !== "password");
  if (args.password !== undefined) parsedKeys.push("password=(ayarlandı)");
  console.log("Okunan argüman anahtarları:", parsedKeys.join(", ") || "(yok)");

  if (password !== undefined && password !== "") {
    const { error } = await supabase.auth.admin.updateUserById(userId, { password });
    if (error) throw error;
    console.log("Şifre güncellendi (Admin API).");
  }

  const credits = creditsRaw !== undefined && creditsRaw !== "" ? Number.parseInt(String(creditsRaw).trim(), 10) : NaN;
  const willAddCredits = !Number.isNaN(credits) && credits !== 0;

  if (!willAddCredits && creditsRaw !== undefined && creditsRaw !== "") {
    console.error(
      'Geçersiz credits değeri (tam sayı beklenir). Örnek: credits=50 veya PowerShell: \'credits=50\''
    );
    process.exit(1);
  }

  if (!willAddCredits) {
    if (password !== undefined && password !== "") {
      console.warn(
        "Kontör eklenmedi: komutta credits=N yok veya okunamadı. Tekrar çalıştırın: ... 'credits=50' (50 yerine istediğiniz miktar)."
      );
    }
  }

  if (willAddCredits) {
    if (credits < 1) {
      console.error("credits pozitif tam sayı olmalı.");
      process.exit(1);
    }

    const maxVersions = args["max-versions"] ? Number.parseInt(String(args["max-versions"]).trim(), 10) : 5;
    const { error: e1 } = await supabase.rpc("ensure_entitlement", {
      p_owner_type: "user",
      p_owner_id: userId,
      p_default_credits: 0,
      p_default_max_versions: Number.isFinite(maxVersions) ? maxVersions : 5,
    });
    if (e1) throw e1;

    const { data: newBal, error: e2 } = await supabase.rpc("add_credits", {
      p_owner_type: "user",
      p_owner_id: userId,
      p_amount: credits,
    });
    if (e2) throw e2;
    console.log("Kontör eklendi. Yeni bakiye:", newBal);
  }

  if ((password === undefined || password === "") && !willAddCredits) {
    console.warn("Ne password ne de geçerli credits verildi; yalnızca kullanıcı doğrulandı.");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
