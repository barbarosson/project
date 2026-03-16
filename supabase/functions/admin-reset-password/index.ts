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
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") || "ModulusTech <info@modulusaas.com>";

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
      const appUrl = Deno.env.get("SITE_URL") || "https://modulusaas.com";
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px; background: #0f172a0d;">
  <div style="background: #ffffff; border-radius: 16px; padding: 24px 24px 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15,23,42,0.08);">
    <div style="border-radius: 999px; padding: 4px 12px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; background: #ecfeff; color: #0891b2; margin-bottom: 12px;">
      <span style="width: 6px; height: 6px; border-radius: 999px; background: #22c55e;"></span>
      MODULUSAAS · GÜVENLİK BİLDİRİMİ
    </div>
    <h2 style="color: #0f172a; margin: 4px 0 8px; font-size: 22px;">Şifreniz sıfırlandı</h2>
    <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">
      ModulusSaaS hesabınız için geçici bir giriş şifresi oluşturduk. Bu şifreyi kullanarak giriş yaptıktan sonra
      sizden <strong>yeni ve kalıcı bir şifre belirlemeniz</strong> istenecek.
    </p>
    <div style="margin: 18px 0 16px;">
      <div style="font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
        Geçici giriş şifreniz
      </div>
      <p style="font-size: 22px; font-weight: 700; letter-spacing: 6px; background: #0f172a; color: #e5f2ff; padding: 14px 20px; border-radius: 12px; text-align: center; border: 1px solid #1e293b;">
        ${tempCode}
      </p>
      <p style="margin: 6px 0 0; font-size: 11px; color: #64748b; text-align: center;">
        Bu şifre sadece bir kez kullanım içindir ve girişten sonra sizden yeni şifre belirlemeniz istenecektir.
      </p>
    </div>
    <p style="margin: 4px 0 14px; font-size: 13px; color: #64748b;">
      Güvenliğiniz için bu şifreyi <strong>kimseyle paylaşmayın</strong>. ModulusSaaS ekibi sizden
      asla şifrenizi veya bu kodu istemez.
    </p>
    <p style="margin: 0 0 18px; font-size: 13px; color: #64748b;">
      Aşağıdaki butona tıklayarak ModulusSaaS’e gidebilir ve hesabınıza giriş yapabilirsiniz:
    </p>
    <p style="margin: 0 0 18px;">
      <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg,#0f766e,#22c55e); color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 999px; font-weight: 600; font-size: 14px; box-shadow: 0 8px 20px rgba(16,185,129,0.35);">
        ModulusSaaS'e Git
      </a>
    </p>
    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
      Eğer bu işlem sizin tarafınızdan yapılmadıysa, lütfen hemen şifrenizi değiştirin ve
      <a href="mailto:info@modulusaas.com" style="color:#0ea5e9; text-decoration:none;">info@modulusaas.com</a>
      adresinden bizimle iletişime geçin.
    </p>
    <p style="margin: 10px 0 0; font-size: 11px; color: #cbd5f5;">
      Bu e-posta ModulusSaaS tarafından otomatik olarak gönderilmiştir.
    </p>
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
            from: RESEND_FROM_EMAIL,
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
