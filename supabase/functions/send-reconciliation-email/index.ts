import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface ReconciliationPayload {
  reconciliation_id: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount || 0);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let reconciliation_id: string | undefined;
    try {
      const body = await req.json();
      reconciliation_id = body?.reconciliation_id != null ? String(body.reconciliation_id) : undefined;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!reconciliation_id) {
      return new Response(
        JSON.stringify({ error: "Missing reconciliation_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: rec, error: recError } = await supabase
      .from("reconciliation_requests")
      .select(
        `
        *,
        customer:customers(company_title, name, email, tax_id, tax_office)
      `
      )
      .eq("id", reconciliation_id)
      .maybeSingle();

    if (recError) {
      console.error("Reconciliation fetch error:", recError.message, "id:", reconciliation_id);
      return new Response(
        JSON.stringify({
          error: "Reconciliation not found",
          details: "Database query failed. Check that the table exists and RLS allows service role access.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!rec) {
      console.error("Reconciliation not found for id:", reconciliation_id);
      return new Response(
        JSON.stringify({
          error: "Reconciliation not found",
          details: "No row with this id. Ensure the request was saved and you are using the same Supabase project.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const customerEmail = rec.sent_to_email || rec.customer?.email;
    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "Customer email not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const responseUrl = `${supabaseUrl}/functions/v1/send-reconciliation-email?action=respond&id=${reconciliation_id}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1a1a2e; margin: 0; padding: 0; background: #f0f2f5; }
            .wrapper { max-width: 640px; margin: 0 auto; padding: 24px; }
            .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #0f4c75, #1b6ca8); color: white; padding: 32px; }
            .header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
            .header p { margin: 0; opacity: 0.85; font-size: 14px; }
            .body { padding: 32px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
            .info-item .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
            .info-item .value { font-size: 15px; font-weight: 600; color: #1a1a2e; }
            .table-wrapper { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 28px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f8f9fb; padding: 12px 16px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; }
            td { padding: 14px 16px; font-size: 15px; border-bottom: 1px solid #f0f0f0; }
            .amount { text-align: right; font-variant-numeric: tabular-nums; }
            .closing-row td { font-weight: 700; font-size: 16px; background: #f0fdf4; border-top: 2px solid #16a34a; }
            .actions { text-align: center; padding: 24px 0; }
            .btn { display: inline-block; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 6px; }
            .btn-agree { background: #16a34a; color: white; }
            .btn-disagree { background: #dc2626; color: white; }
            .footer { text-align: center; padding: 20px 32px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f0f0f0; }
            .ref-number { font-family: monospace; font-size: 13px; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="card">
              <div class="header">
                <h1>Cari Mutabakat Mektubu</h1>
                <p>Reconciliation Statement</p>
                <div style="margin-top: 12px;">
                  <span class="ref-number">${rec.request_number}</span>
                </div>
              </div>
              <div class="body">
                <p style="margin-top: 0;">Sayın <strong>${rec.customer?.company_title || ""}</strong>,</p>
                <p>Aşağıda belirtilen dönem için hesap mutabakatınızı dikkatinize sunarız. Lütfen kayıtlarınızla karşılaştırarak mutabakat durumunuzu bildiriniz.</p>

                <div class="info-grid">
                  <div class="info-item">
                    <div class="label">Cari Unvan</div>
                    <div class="value">${rec.customer?.company_title || "-"}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Yetkili</div>
                    <div class="value">${rec.customer?.name || "-"}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Dönem Başlangıç</div>
                    <div class="value">${formatDate(rec.start_date)}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Dönem Bitiş</div>
                    <div class="value">${formatDate(rec.end_date)}</div>
                  </div>
                </div>

                <div class="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Kalem</th>
                        <th class="amount">Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Dönem Başı Bakiye (Açılış)</td>
                        <td class="amount">${formatCurrency(rec.opening_balance)}</td>
                      </tr>
                      <tr>
                        <td>Toplam Borç</td>
                        <td class="amount">${formatCurrency(rec.total_debits)}</td>
                      </tr>
                      <tr>
                        <td>Toplam Alacak</td>
                        <td class="amount">${formatCurrency(rec.total_credits)}</td>
                      </tr>
                      <tr class="closing-row">
                        <td>Dönem Sonu Bakiye (Kapanış)</td>
                        <td class="amount">${formatCurrency(rec.closing_balance)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="actions">
                  <p style="margin-bottom: 16px; color: #6b7280; font-size: 14px;">Bu mutabakatı onaylıyor musunuz?</p>
                  <a href="${responseUrl}&response=agreed" class="btn btn-agree">Mutabıkım</a>
                  <a href="${responseUrl}&response=disagreed" class="btn btn-disagree">Mutabık Değilim</a>
                </div>

                <p style="font-size: 13px; color: #9ca3af; text-align: center;">
                  Mutabakat yanıtınız otomatik olarak kayıt altına alınacaktır.
                </p>
              </div>
              <div class="footer">
                <p>ModulusTech ERP - Cari Mutabakat Sistemi</p>
                <p>Bu e-posta otomatik olarak oluşturulmuştur.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    if (req.method === "GET") {
      const url = new URL(req.url);
      const action = url.searchParams.get("action");
      const id = url.searchParams.get("id");
      const response = url.searchParams.get("response");

      if (action === "respond" && id && response) {
        const { error: updateError } = await supabase
          .from("reconciliation_requests")
          .update({
            status: response,
            response_received_at: new Date().toISOString(),
            response_method: "email",
          })
          .eq("id", id);

        const statusText =
          response === "agreed" ? "MUTABIK" : "MUTABIK DEGİL";
        const bgColor = response === "agreed" ? "#16a34a" : "#dc2626";

        const responseHtml = `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f2f5;">
              <div style="text-align: center; background: white; padding: 48px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: ${bgColor}; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                  <span style="color: white; font-size: 28px;">${response === "agreed" ? "✓" : "✗"}</span>
                </div>
                <h2 style="margin: 0 0 8px; color: #1a1a2e;">Yanıtınız Kaydedildi</h2>
                <p style="color: #6b7280; margin: 0;">Mutabakat durumunuz: <strong style="color: ${bgColor};">${statusText}</strong></p>
                <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">Bu sayfayı kapatabilirsiniz. Teşekkürler.</p>
              </div>
            </body>
          </html>
        `;

        return new Response(responseHtml, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    if (!RESEND_API_KEY) {
      await supabase
        .from("reconciliation_requests")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", reconciliation_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Reconciliation saved (email not configured)",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ModulusTech <noreply@modulus.app>",
        to: [customerEmail],
        subject: `Cari Mutabakat Mektubu - ${rec.request_number}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error("Resend error:", errText);
      throw new Error("Failed to send email");
    }

    await supabase
      .from("reconciliation_requests")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", reconciliation_id);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
