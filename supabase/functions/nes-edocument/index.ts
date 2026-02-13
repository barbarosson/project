import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function friendlyError(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err);

  if (
    raw.includes("dns error") ||
    raw.includes("Name or service not known") ||
    raw.includes("failed to lookup") ||
    raw.includes("getaddrinfo")
  ) {
    return {
      message:
        "NES API sunucusuna baglantilamadi. API adresi erisime kapali veya yanlis olabilir. Ayarlardan API adresini kontrol edin.",
      status: 502,
    };
  }
  if (raw.includes("Connection refused") || raw.includes("connect error")) {
    return {
      message:
        "NES API sunucusu baglanti reddetti. Sunucu gecici olarak kapali olabilir.",
      status: 502,
    };
  }
  if (raw.includes("timed out") || raw.includes("deadline")) {
    return {
      message:
        "NES API sunucusu yanit vermedi (zaman asimi). Daha sonra tekrar deneyin.",
      status: 504,
    };
  }
  if (raw.includes("certificate") || raw.includes("SSL") || raw.includes("TLS")) {
    return {
      message:
        "NES API sunucusu ile guvenli baglanti kurulamadi (SSL/TLS hatasi).",
      status: 502,
    };
  }

  return { message: raw || "Bilinmeyen bir hata olustu", status: 500 };
}

async function nesRequest<T>(
  baseUrl: string,
  token: string,
  method: string,
  path: string,
  body?: unknown,
  timeoutMs = 15000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const options: RequestInit = {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    const url = `${baseUrl}${path}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `NES API hata (${response.status}): ${text || response.statusText}`
      );
    }

    return response.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const client = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ success: false, error: "Invalid token" }, 401);
    }

    const body = await req.json();
    const { action, tenant_id, ...params } = body;

    if (!tenant_id) {
      return jsonResponse({ success: false, error: "Missing tenant_id" }, 400);
    }

    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: settings } = await serviceClient
      .from("edocument_settings")
      .select("*")
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    if (!settings) {
      return jsonResponse(
        {
          success: false,
          error:
            "E-belge entegrasyonu yapilandirilmamis. Ayarlar sayfasindan yapilandirin.",
        },
        400
      );
    }

    if (!settings.is_active) {
      return jsonResponse(
        { success: false, error: "E-belge entegrasyonu devre disi." },
        400
      );
    }

    if (!settings.api_key) {
      return jsonResponse(
        {
          success: false,
          error:
            "API anahtari yapilandirilmamis. NES Portal uzerinden bir anahtar olusturun.",
        },
        400
      );
    }

    const nesToken = settings.api_key;
    const baseUrl = settings.api_base_url;

    let result: unknown;

    switch (action) {
      case "test_connection": {
        try {
          result = await nesRequest(
            baseUrl,
            nesToken,
            "GET",
            "/api/v2/Account/GetAccountInfo",
            undefined,
            10000
          );
          result = {
            connected: true,
            api_base_url: baseUrl,
            account_info: result,
          };
        } catch (testErr: any) {
          const friendly = friendlyError(testErr);
          return jsonResponse(
            {
              success: false,
              error: `Baglanti testi basarisiz: ${friendly.message}`,
              api_base_url: baseUrl,
            },
            friendly.status
          );
        }
        break;
      }

      case "check_taxpayer": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/CheckTaxPayer",
          { TcknVkn: params.vkn }
        );
        break;
      }

      case "send_invoice": {
        const invoicePayload = {
          ...params.invoice_data,
          DraftFlag: params.draft ? 1 : 0,
        };

        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/SendInvoice",
          invoicePayload
        );

        if (params.edocument_id) {
          await serviceClient
            .from("edocuments")
            .update({
              status: params.draft ? "draft" : "queued",
              nes_response: result,
              updated_at: new Date().toISOString(),
            })
            .eq("id", params.edocument_id);

          await serviceClient.from("edocument_activity_log").insert({
            tenant_id,
            edocument_id: params.edocument_id,
            action: params.draft ? "saved_as_draft" : "sent_to_nes",
            details: "Invoice sent via NES API",
            performed_by: user.id,
          });
        }
        break;
      }

      case "send_invoice_ubl": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/SendInvoiceUBL",
          { UblXml: params.ubl_xml, DraftFlag: params.draft ? 1 : 0 }
        );
        break;
      }

      case "send_earchive": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EArchive/SendInvoice",
          params.invoice_data
        );

        if (params.edocument_id) {
          await serviceClient
            .from("edocuments")
            .update({
              status: "queued",
              nes_response: result,
              updated_at: new Date().toISOString(),
            })
            .eq("id", params.edocument_id);
        }
        break;
      }

      case "get_incoming_invoices": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/GetIncomingInvoiceList",
          { BeginDate: params.begin_date, EndDate: params.end_date }
        );
        break;
      }

      case "get_outgoing_invoices": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/GetOutgoingInvoiceList",
          { BeginDate: params.begin_date, EndDate: params.end_date }
        );
        break;
      }

      case "get_invoice_xml": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/GetInvoiceXml",
          { Ettn: params.ettn, Direction: params.direction }
        );
        break;
      }

      case "get_invoice_html": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/GetInvoiceHtml",
          { Ettn: params.ettn, Direction: params.direction }
        );
        break;
      }

      case "set_transferred": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/SetInvoiceTransferred",
          { EttnList: params.ettn_list }
        );
        break;
      }

      case "approve_draft": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/ApproveDraftInvoice",
          { EttnList: params.ettn_list }
        );

        if (params.edocument_id) {
          await serviceClient
            .from("edocuments")
            .update({
              status: "queued",
              updated_at: new Date().toISOString(),
            })
            .eq("id", params.edocument_id);
        }
        break;
      }

      case "delete_draft": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/DeleteDraftInvoice",
          { EttnList: params.ettn_list }
        );
        break;
      }

      case "send_despatch": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EDespatch/SendDespatch",
          params.despatch_data
        );

        if (params.edocument_id) {
          await serviceClient
            .from("edocuments")
            .update({
              status: "queued",
              nes_response: result,
              updated_at: new Date().toISOString(),
            })
            .eq("id", params.edocument_id);
        }
        break;
      }

      case "get_incoming_despatches": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EDespatch/GetIncomingDespatchList",
          { BeginDate: params.begin_date, EndDate: params.end_date }
        );
        break;
      }

      case "send_esmm": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/ESMM/SendVoucher",
          params.voucher_data
        );

        if (params.edocument_id) {
          await serviceClient
            .from("edocuments")
            .update({
              status: "queued",
              nes_response: result,
              updated_at: new Date().toISOString(),
            })
            .eq("id", params.edocument_id);
        }
        break;
      }

      case "send_emm": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EMM/SendVoucher",
          params.voucher_data
        );

        if (params.edocument_id) {
          await serviceClient
            .from("edocuments")
            .update({
              status: "queued",
              nes_response: result,
              updated_at: new Date().toISOString(),
            })
            .eq("id", params.edocument_id);
        }
        break;
      }

      case "send_ebook": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EBook/SendBook",
          params.book_data
        );
        break;
      }

      case "get_account_info": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "GET",
          "/api/v2/Account/GetAccountInfo"
        );
        break;
      }

      case "get_templates": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "GET",
          "/api/v2/EInvoice/DownloadTemplateList"
        );
        break;
      }

      case "get_earchive_status": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EArchive/GetInvoiceStatus",
          { EttnList: params.ettn_list }
        );
        break;
      }

      case "cancel_earchive": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EArchive/CancelInvoice",
          { EttnList: params.ettn_list }
        );
        break;
      }

      case "get_credit_balance": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "GET",
          "/api/v2/Account/GetCreditBalance"
        );
        break;
      }

      case "get_invoice_status": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/GetInvoiceStatus",
          { EttnList: params.ettn_list }
        );

        if (params.edocument_id && result) {
          const statusResult = (result as any)?.Result;
          if (statusResult?.StatusList?.[0]?.Status) {
            await serviceClient
              .from("edocuments")
              .update({
                status: statusResult.StatusList[0].Status.toLowerCase(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", params.edocument_id);
          }
        }
        break;
      }

      case "cancel_einvoice": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EInvoice/CancelInvoice",
          {
            EttnList: params.ettn_list,
            CancelNote: params.cancel_note || "",
          }
        );

        if (params.edocument_id) {
          await serviceClient
            .from("edocuments")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", params.edocument_id);
        }
        break;
      }

      case "get_earchive_pdf": {
        result = await nesRequest(
          baseUrl,
          nesToken,
          "POST",
          "/api/v2/EArchive/GetInvoicePdf",
          { Ettn: params.ettn }
        );
        break;
      }

      default:
        return jsonResponse(
          { success: false, error: `Bilinmeyen islem: ${action}` },
          400
        );
    }

    return jsonResponse({ success: true, data: result });
  } catch (error) {
    console.error("[NES E-Document] Error:", error);
    const { message, status } = friendlyError(error);
    return jsonResponse({ success: false, error: message }, status);
  }
});
