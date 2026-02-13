import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface WelcomePayload {
  email: string;
  fullName: string;
  language?: string;
  type?: string;
}

function buildWelcomeHtml(fullName: string, lang: string): string {
  const isTr = lang === "tr";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f7fa}
  .wrap{max-width:600px;margin:0 auto;padding:20px}
  .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .hdr{background:linear-gradient(135deg,#00D4AA 0%,#00B894 100%);color:#fff;padding:40px 30px;text-align:center}
  .hdr h1{margin:0;font-size:28px}
  .hdr p{margin:8px 0 0;opacity:.9;font-size:16px}
  .body{padding:30px}
  .body p{margin:0 0 16px;font-size:15px}
  .steps{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0}
  .steps h3{margin:0 0 12px;color:#166534;font-size:16px}
  .steps ol{margin:0;padding-left:20px}
  .steps li{margin-bottom:8px;color:#15803d}
  .cta{text-align:center;margin:24px 0}
  .cta a{display:inline-block;background:#00D4AA;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px}
  .ftr{text-align:center;padding:20px 30px;color:#9ca3af;font-size:12px;border-top:1px solid #f3f4f6}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="hdr">
      <h1>${isTr ? "Hosgeldiniz!" : "Welcome!"}</h1>
      <p>ModulusTech ERP</p>
    </div>
    <div class="body">
      <p>${isTr ? `Merhaba <strong>${fullName}</strong>,` : `Hello <strong>${fullName}</strong>,`}</p>
      <p>${
        isTr
          ? "ModulusTech ERP ailesine katildiginiz icin tesekkur ederiz! Hesabiniz basariyla aktif edildi."
          : "Thank you for joining the ModulusTech ERP family! Your account has been successfully activated."
      }</p>
      <div class="steps">
        <h3>${isTr ? "Hizli Baslangic" : "Quick Start"}</h3>
        <ol>
          <li>${
            isTr
              ? "Dashboard'a giris yaparak genel gorunume ulasabilirsiniz"
              : "Log in to the dashboard to see your overview"
          }</li>
          <li>${
            isTr
              ? "Musterilerinizi ve urunlerinizi ekleyin"
              : "Add your customers and products"
          }</li>
          <li>${
            isTr
              ? "Ilk faturanizi olusturun"
              : "Create your first invoice"
          }</li>
          <li>${
            isTr
              ? "Finansal raporlari kesfetmeye baslayin"
              : "Start exploring financial reports"
          }</li>
        </ol>
      </div>
      <p>${
        isTr
          ? "Herhangi bir sorunuz varsa, destek ekibimiz her zaman yardimci olmaya hazir."
          : "If you have any questions, our support team is always ready to help."
      }</p>
      <div class="cta">
        <a href="https://modulustech.app/dashboard">${
          isTr ? "Dashboard'a Git" : "Go to Dashboard"
        }</a>
      </div>
    </div>
    <div class="ftr">
      <p>ModulusTech ERP &copy; ${new Date().getFullYear()}</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, fullName, language, type }: WelcomePayload =
      await req.json();

    if (!email || !fullName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, fullName" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping email send");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lang = language || "tr";
    const isTr = lang === "tr";
    const subject = isTr
      ? `Hosgeldiniz ${fullName}! - ModulusTech ERP`
      : `Welcome ${fullName}! - ModulusTech ERP`;

    const html = buildWelcomeHtml(fullName, lang);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [email],
        subject,
        html,
      }),
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Email send failed:", responseData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send welcome email",
          details: responseData,
        }),
        {
          status: emailResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent",
        id: responseData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Welcome email error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
