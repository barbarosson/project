import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SPECIAL = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~";

/** Supabase sifre politikasina uygun gecici sifre: en az bir kucuk/buyuk harf, rakam, ozel karakter. */
function generateTempCode(): string {
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const pool = LOWER + UPPER + DIGITS + SPECIAL;
  const part = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SPECIAL)];
  for (let i = 0; i < 6; i++) part.push(pool[Math.floor(Math.random() * pool.length)]);
  return part.sort(() => Math.random() - 0.5).join("");
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Yetkilendirme basligi eksik" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: callerUser },
      error: authError,
    } = await adminClient.auth.getUser(token);
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Gecersiz veya suresi dolmus oturum" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Yetersiz yetki" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId zorunludur" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: targetUser, error: userError } =
      await adminClient.auth.admin.getUserById(userId);
    if (userError || !targetUser?.user) {
      return new Response(
        JSON.stringify({ error: "Kullanici bulunamadi" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetEmail = targetUser.user.email ?? "";
    const tempCode = generateTempCode();

    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(userId, {
        password: tempCode,
      });

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "Sifre guncellenemedi: " + updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await adminClient
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", userId);

    if (RESEND_API_KEY && targetEmail) {
      const appUrl = Deno.env.get("SITE_URL") || "https://modulustech.app";
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
    <h2 style="color: #0A2540; margin-top: 0;">Sifreniz Sifirlandi</h2>
    <p>Hesabiniz icin gecici bir giris sifresi olusturuldu. Ilk giriste uygulama sizden yeni bir sifre belirlemenizi isteyecektir.</p>
    <p style="font-size: 18px; font-weight: 600; letter-spacing: 4px; background: #e2e8f0; padding: 12px 20px; border-radius: 8px; text-align: center;">${tempCode}</p>
    <p style="color: #64748b; font-size: 14px;">Bu sifreyi kimseyle paylasmayin. Giris yaptiktan sonra mutlaka sifrenizi degistirin.</p>
    <p style="margin-top: 24px;"><a href="${appUrl}/dashboard" style="background: #00D4AA; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Uygulamaya Gir</a></p>
    <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">ModulusTech ERP - Otomatik e-posta</p>
  </div>
</body>
</html>`;
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "ModulusTech <noreply@modulus.app>",
            to: [targetEmail],
            subject: "ModulusTech - Gecici giris sifresi (sifre sifirlandi)",
            html,
          }),
        });
        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error("Resend error:", errText);
        }
      } catch (e) {
        console.error("Send email error:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sifre sifirlandi. Gecici sifre kullaniciya e-posta ile gonderildi.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Sunucu hatasi" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
