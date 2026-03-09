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
    raw.includes("getaddrinfo") ||
    raw.includes("ENOTFOUND") ||
    raw.includes("EAI_AGAIN")
  ) {
    return {
      message:
        "NES API adresi cozulemedi (DNS hatasi). API Adresini kontrol edin: https ile baslamali, yazim dogru olmali (ornegin https://apitest.nes.com.tr). " +
        "Ayrica NES tarafinda sunucu IP kısıtlamasi varsa, kullandiginiz hosting (Supabase) IP adreslerini NES'e iletip acilmasini isteyin.",
      status: 502,
    };
  }
  if (raw.includes("Connection refused") || raw.includes("connect error") || raw.includes("ECONNREFUSED")) {
    return {
      message:
        "NES API sunucusu baglanti reddetti. Sunucu kapali olabilir veya NES tarafinda IP kısıtlamasi (whitelist) vardir. " +
        "Supabase/cloud sunucu IP'lerinizi NES'e iletip erisim acilmasini isteyin.",
      status: 502,
    };
  }
  if (raw.includes("timed out") || raw.includes("deadline") || raw.includes("ETIMEDOUT")) {
    return {
      message:
        "NES API sunucusu yanit vermedi (zaman asimi). Ag erisimi engelleniyor olabilir veya NES IP kısıtlamasi uyguluyor olabilir. " +
        "NES ile iletişime gecin: entegrasyon@nesbilgi.com.tr",
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

const EINVOICE_API_BASE = "/einvoice";

function escapeXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildUblTrFromInvoiceData(data: Record<string, unknown>): string {
  // GIB: Fatura numarasi 16 karakter: 3 seri + 4 yil + 9 sira. 03.10.2025 itibariyle 'GIB' serisi kullanilamaz.
  const rawId = String(data.InvoiceNumber ?? data.InvoiceId ?? "").trim();
  const digitsOnly = rawId.replace(/\D/g, "");
  const year = new Date().getFullYear().toString();
  let series = String(data.DefaultSeries ?? "INV").slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "I") || "INV";
  if (series === "GIB") series = "INV";
  const seriesPart = (series + "INV").slice(0, 3);
  const seqNum = digitsOnly.length >= 1 ? digitsOnly.slice(-9) : String(Date.now()).slice(-9);
  const sequencePart = seqNum.padStart(9, "0");
  const docId = escapeXml(seriesPart + year + sequencePart);
  const issueDate = escapeXml(String(data.IssueDate ?? new Date().toISOString().split("T")[0]));
  const invoiceType = escapeXml(String(data.InvoiceType ?? "SATIS"));
  const currency = escapeXml(String(data.Currency ?? "TRY"));
  const senderDigits = String(data.SenderVkn ?? "").replace(/\D/g, "");
  const senderScheme = senderDigits.length === 11 ? "TCKN" : "VKN";
  const senderId = senderDigits.length === 11 ? senderDigits : (senderDigits.length === 10 ? senderDigits : senderDigits.padStart(10, "0").slice(-10));
  const senderVkn = escapeXml(senderId);
  const senderTitle = escapeXml(String(data.SenderTitle ?? ""));
  const receiverDigits = String(data.ReceiverVkn ?? "").replace(/\D/g, "");
  const receiverScheme = receiverDigits.length === 11 ? "TCKN" : "VKN";
  const receiverId = receiverDigits.length === 11 ? receiverDigits : (receiverDigits.length === 10 ? receiverDigits : receiverDigits.padStart(10, "0").slice(-10));
  const receiverVkn = escapeXml(receiverId);
  const receiverTitle = escapeXml(String(data.ReceiverTitle ?? ""));
  const receiverCity = escapeXml(String(data.ReceiverCity ?? ""));
  const receiverCountry = escapeXml(String(data.ReceiverCountry ?? "Türkiye"));
  const taxExclusive = Number(data.TaxExclusiveAmount ?? data.SubTotal ?? 0);
  const taxAmount = Number(data.TaxAmount ?? data.TaxTotal ?? 0);
  const payable = Number(data.PayableAmount ?? data.GrandTotal ?? data.TaxInclusiveAmount ?? 0);
  let lines = (Array.isArray(data.Lines) ? data.Lines : []) as Array<Record<string, unknown>>;
  if (lines.length === 0 && (payable > 0 || taxExclusive > 0)) {
    lines = [{ Name: "Hizmet", Quantity: 1, UnitPrice: taxExclusive || payable, LineTotal: taxExclusive || payable }];
  }

  const lineXml = lines
    .map((line, idx) => {
      const lineNum = idx + 1;
      const qty = Number(line.Quantity ?? 1);
      const unitPrice = Number(line.UnitPrice ?? 0);
      const lineTotal = Number(line.LineTotal ?? line.Amount ?? qty * unitPrice);
      const desc = escapeXml(String(line.Name ?? line.Description ?? ""));
      const rawUnit = String(line.UnitCode ?? "C62").toUpperCase();
      const unitCode = escapeXml(rawUnit === "ADET" ? "C62" : rawUnit || "C62");
      return `<cac:InvoiceLine>
        <cbc:ID>${lineNum}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${unitCode}">${qty}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${currency}">${lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:Item><cbc:Name>${desc}</cbc:Name></cac:Item>
        <cac:Price><cbc:PriceAmount currencyID="${currency}">${unitPrice.toFixed(2)}</cbc:PriceAmount></cac:Price>
      </cac:InvoiceLine>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TEMELFATURA</cbc:ProfileID>
  <cbc:ID>${docId}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>${invoiceType}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${currency}</cbc:TaxCurrencyCode>
  <cbc:LineCountNumeric>${lines.length}</cbc:LineCountNumeric>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="${senderScheme}">${senderVkn}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${senderTitle}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cbc:StreetName></cbc:StreetName><cbc:BuildingNumber></cbc:BuildingNumber><cbc:CitySubdivisionName></cbc:CitySubdivisionName><cbc:CityName></cbc:CityName><cac:Country><cbc:IdentificationCode>TR</cbc:IdentificationCode><cbc:Name>Türkiye</cbc:Name></cac:Country></cac:PostalAddress>
      ${senderScheme === "TCKN" ? `<cac:Person><cbc:FirstName>Ad</cbc:FirstName><cbc:FamilyName>${senderTitle || "Kisi"}</cbc:FamilyName></cac:Person>` : ""}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="${receiverScheme}">${receiverVkn}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${receiverTitle}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cbc:StreetName></cbc:StreetName><cbc:BuildingNumber></cbc:BuildingNumber><cbc:CitySubdivisionName></cbc:CitySubdivisionName><cbc:CityName>${receiverCity}</cbc:CityName><cac:Country><cbc:IdentificationCode>TR</cbc:IdentificationCode><cbc:Name>Türkiye</cbc:Name></cac:Country></cac:PostalAddress>
      ${receiverScheme === "TCKN" ? `<cac:Person><cbc:FirstName>Ad</cbc:FirstName><cbc:FamilyName>${receiverTitle || "Kisi"}</cbc:FamilyName></cac:Person>` : ""}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${taxAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${taxExclusive.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:TaxExemptionReasonCode>VAT</cbc:TaxExemptionReasonCode><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${taxExclusive.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${taxExclusive.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${payable.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${payable.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lineXml}
</Invoice>`;
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

async function nesRequest<T>(
  baseUrl: string,
  token: string,
  method: string,
  path: string,
  body?: unknown,
  timeoutMs = 15000,
  queryParams?: Record<string, string | number | boolean | undefined>
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

    if (body && (method === "POST" || method === "PUT" || method === "DELETE") && typeof body === "object" && !(body instanceof FormData)) {
      options.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      (options as any).headers = { Authorization: `Bearer ${token}` };
      delete (options as any).headers["Content-Type"];
      options.body = body;
    }

    const url = `${baseUrl}${path}${queryParams ? buildQueryString(queryParams) : ""}`;
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text().catch(() => "");

    if (!response.ok) {
      throw new Error(
        `NES API hata (${response.status}): ${text || response.statusText}`
      );
    }

    if (!contentType.includes("application/json") || text.trimStart().startsWith("<")) {
      throw new Error(
        "Sunucu JSON yerine HTML dondu. API Adresi yanlis olabilir. " +
        "Dokumantasyon adresi (developertest.nes.com.tr) degil, NES'in verdigi gercek API adresini girin (ornegin https://apitest.nes.com.tr)."
      );
    }

    try {
      return JSON.parse(text) as T;
    } catch (_) {
      throw new Error(
        "API yaniti gecerli JSON degil. Kurulum'daki API Adresi alanini kontrol edin. " +
        "NES dokuman sitesi degil, API base URL (ornegin https://apitest.nes.com.tr) girilmelidir."
      );
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function nesRequestText(
  baseUrl: string,
  token: string,
  method: string,
  path: string,
  timeoutMs = 15000
): Promise<{ content: string; contentType: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const t = await response.text().catch(() => "");
      throw new Error(`NES API hata (${response.status}): ${t || response.statusText}`);
    }
    const content = await response.text();
    const contentType = response.headers.get("content-type");
    return { content, contentType };
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("timed out");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeIncomingInvoiceList(apiResult: any): any {
  const data = apiResult?.data ?? [];
  const list = Array.isArray(data) ? data : [];
  return {
    Result: {
      InvoiceList: list.map((item: any) => ({
        Id: item.id,
        Ettn: item.id,
        UUID: item.id,
        InvoiceNumber: item.documentNumber,
        IssueDate: item.issueDate,
        SenderTitle: item.accountingSupplierParty?.partyName,
        SenderIdentifier: item.accountingSupplierParty?.partyIdentification,
        PayableAmount: item.payableAmount,
        DocumentCurrencyCode: item.documentCurrencyCode,
        Status: item.recordStatus ?? item.documentAnswer ?? "delivered",
        InvoiceType: item.invoiceTypeCode,
      })),
    },
    page: apiResult?.page,
    pageSize: apiResult?.pageSize,
    totalCount: apiResult?.totalCount,
  };
}

function normalizeOutgoingInvoiceList(apiResult: any): any {
  const data = apiResult?.data ?? [];
  const list = Array.isArray(data) ? data : [];
  return {
    Result: {
      InvoiceList: list.map((item: any) => ({
        Id: item.id,
        Ettn: item.id,
        UUID: item.id,
        InvoiceNumber: item.documentNumber,
        IssueDate: item.issueDate,
        ReceiverTitle: item.accountingCustomerParty?.partyName,
        ReceiverIdentifier: item.accountingCustomerParty?.partyIdentification,
        PayableAmount: item.payableAmount,
        DocumentCurrencyCode: item.documentCurrencyCode,
        Status: item.outgoingStatus ?? item.recordStatus ?? "delivered",
        InvoiceType: item.invoiceTypeCode,
      })),
    },
    page: apiResult?.page,
    pageSize: apiResult?.pageSize,
    totalCount: apiResult?.totalCount,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Authorization header (Bearer token) gerekli." }, 401);
    }
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) {
      return jsonResponse({ success: false, error: "Gecersiz token." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const client = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await client.auth.getUser(jwt);
    if (authError || !user) {
      const hint = authError?.message ? ` (${authError.message})` : "";
      return jsonResponse(
        { success: false, error: `Oturum dogrulanamadi${hint}. Cikis yapip tekrar giris yapin.` },
        401
      );
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
    const baseUrl = (settings.api_base_url || "").trim().replace(/\/+$/, "") || "";
    const einvoiceBase = baseUrl ? `${baseUrl}${EINVOICE_API_BASE}` : "";

    let result: unknown;

    switch (action) {
      case "test_connection": {
        try {
          await nesRequest(
            einvoiceBase,
            nesToken,
            "GET",
            "/v1/outgoing/invoices",
            undefined,
            10000,
            { pageSize: 1, page: 1 }
          );
          result = {
            connected: true,
            api_base_url: baseUrl,
            account_info: { message: "E-Fatura API baglantisi basarili." },
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
        const vkn = String(params.vkn || "").trim();
        if (!vkn) {
          return jsonResponse({ success: false, error: "VKN/TCKN gerekli." }, 400);
        }
        const getProp = (o: unknown, ...keys: string[]): string => {
          if (o == null || typeof o !== "object") return "";
          const obj = o as Record<string, unknown>;
          for (const k of keys) {
            const v = obj[k];
            if (typeof v === "string") return v;
            const lower = Object.keys(obj).find((key) => key.toLowerCase() === k.toLowerCase());
            if (lower && typeof obj[lower] === "string") return obj[lower] as string;
          }
          return "";
        };
        const getAlias = (aliases: unknown): string => {
          if (!Array.isArray(aliases) || aliases.length === 0) return "";
          const first = aliases[0];
          if (typeof first === "string") return first;
          if (first && typeof first === "object") {
            const o = first as Record<string, unknown>;
            return (o.alias ?? o.Alias ?? o.value ?? o.Value ?? "") as string;
          }
          return "";
        };
        const emptyResult = () => ({ Result: { CustomerList: [] as Array<{ Title: string; Alias: string; Type: string; RegisterDate: string }> } });
        const toCustomerList = (userInfo: Record<string, unknown>) => {
          const title = getProp(userInfo, "title", "Title");
          const type = getProp(userInfo, "type", "Type") || "Ozel";
          const registerDate = getProp(userInfo, "firstCreationTime", "FirstCreationTime");
          const aliases = userInfo.aliases ?? userInfo.Aliases;
          const aliasStr = getAlias(aliases);
          return {
            Result: {
              CustomerList: [
                { Title: title, Alias: aliasStr, Type: type, RegisterDate: registerDate },
              ],
            },
          };
        };
        const hasAny = (o: Record<string, unknown>, ...keys: string[]) =>
          keys.some((k) => (o[k] !== undefined && o[k] !== null) || Object.keys(o).some((key) => key.toLowerCase() === k.toLowerCase()));
        const isUserInfo = (d: unknown): d is Record<string, unknown> =>
          d != null && typeof d === "object" && hasAny(d as Record<string, unknown>, "title", "Title", "identifier", "Identifier", "type", "Type", "aliases", "Aliases");

        try {
          const headers: Record<string, string> = {
            Authorization: `Bearer ${nesToken}`,
            "Content-Type": "application/json",
          };

          const tryPost = async (): Promise<{ ok: boolean; status: number; body: unknown }> => {
            const url = `${einvoiceBase}/v1/users/Gb`;
            const res = await fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify([vkn]),
            });
            const status = Number(res.status);
            const text = await res.text().catch(() => "");
            let body: unknown = null;
            if (text && text.trim().length > 0 && !text.trimStart().startsWith("<")) {
              try {
                body = JSON.parse(text);
              } catch {
                body = text;
              }
            }
            return { ok: res.ok, status, body };
          };

          const tryGet = async (): Promise<{ ok: boolean; status: number; body: unknown }> => {
            const url = `${einvoiceBase}/v1/users/${encodeURIComponent(vkn)}/Gb`;
            const res = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${nesToken}` } });
            const status = Number(res.status);
            const text = await res.text().catch(() => "");
            let body: unknown = null;
            if (text && text.trim().length > 0 && !text.trimStart().startsWith("<")) {
              try {
                body = JSON.parse(text);
              } catch {
                body = text;
              }
            }
            return { ok: res.ok, status, body };
          };

          let resp = await tryGet();
          if (resp.status === 404 || (resp.status >= 400 && resp.status < 500 && !resp.ok)) {
            resp = await tryPost();
          }

          const status = Number(resp.status);
          if (status === 404) {
            result = emptyResult();
            break;
          }
          if (!resp.ok) {
            const text = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body ?? "");
            throw new Error(`NES API hata (${status}): ${text || "Not Found"}`);
          }

          const data = resp.body;
          const obj = Array.isArray(data) && data.length > 0 ? data[0] : data;
          if (obj && typeof obj === "object" && isUserInfo(obj)) {
            result = toCustomerList(obj as Record<string, unknown>);
          } else {
            result = emptyResult();
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return jsonResponse(
            { success: false, error: msg.startsWith("NES API") ? msg : `Mukellef sorgulama hatasi: ${msg}` },
            500
          );
        }
        break;
      }

      case "send_invoice": {
        const ublXml = params.ubl_xml ?? params.ublXml;
        const invoiceData = params.invoice_data;
        const senderAlias = (params.sender_alias ?? (settings as any).sender_alias ?? "").toString().trim();

        if (ublXml && typeof ublXml === "string") {
          if (!senderAlias) {
            return jsonResponse(
              { success: false, error: "Gonderici etiketi (SenderAlias) gerekli. Kurulumdan veya istek parametresinden gonderin." },
              400
            );
          }
          const form = new FormData();
          form.set("SenderAlias", senderAlias);
          form.set("File", new Blob([ublXml], { type: "application/xml" }), "invoice.xml");
          form.set("IsDirectSend", params.draft ? "false" : "true");
          form.set("PreviewType", "None");
          form.set("SourceApp", "project-bolt");
          form.set("AutoSaveCompany", "false");
          if (params.receiver_alias) form.set("ReceiverAlias", String(params.receiver_alias));
          result = await nesRequest(einvoiceBase, nesToken, "POST", "/v1/uploads/document", form, 30000);
        } else if (invoiceData && typeof invoiceData === "object") {
          const payload = { ...invoiceData, DraftFlag: params.draft ? 1 : 0 };
          const v2Paths = ["/api/v2/EInvoice/SendInvoice", "/v2/EInvoice/SendInvoice"];
          let lastErr: unknown = null;
          v2Attempt: for (const v2Path of v2Paths) {
            for (const base of [einvoiceBase, baseUrl]) {
              if (!base) continue;
              try {
                result = await nesRequest(base, nesToken, "POST", v2Path, payload, 30000);
                lastErr = null;
                break v2Attempt;
              } catch (e) {
                lastErr = e;
              }
            }
          }
          if (result === undefined && lastErr) {
            const msg = String(lastErr);
            const is404 = msg.includes("404") || msg.includes("Not Found") || msg.includes("default backend");
            if (is404 && senderAlias) {
              try {
                const extractVknFromObj = (o: unknown): string => {
                  if (o == null || typeof o !== "object") return "";
                  const obj = o as Record<string, unknown>;
                  const keys = ["partyIdentification", "PartyIdentification", "identifier", "Identifier", "vkn", "Vkn", "taxNumber", "TaxNumber", "senderVkn", "SenderVkn", "supplierVkn", "SupplierVkn"];
                  for (const k of keys) {
                    const v = obj[k];
                    if (typeof v === "string") {
                      const digits = v.replace(/\D/g, "");
                      if (digits.length === 10 || digits.length === 11) return digits;
                    }
                    if (v != null && typeof v === "object" && !Array.isArray(v)) {
                      const inner = v as Record<string, unknown>;
                      const idVal = inner.id ?? inner.ID ?? inner.value ?? inner.Value;
                      if (typeof idVal === "string") {
                        const digits = idVal.replace(/\D/g, "");
                        if (digits.length === 10 || digits.length === 11) return digits;
                      }
                    }
                  }
                  return "";
                };
                let senderVknFromNes = "";
                try {
                  const outgoing = await nesRequest(
                    einvoiceBase,
                    nesToken,
                    "GET",
                    "/v1/outgoing/invoices",
                    undefined,
                    8000,
                    { pageSize: 1, page: 1 }
                  ) as Record<string, unknown>;
                  const list = (outgoing?.data ?? outgoing?.Data ?? outgoing?.items ?? outgoing?.Items ?? outgoing?.result) as unknown[] | undefined;
                  const first = Array.isArray(list) && list.length > 0 ? list[0] : null;
                  if (first && typeof first === "object") {
                    const rec = first as Record<string, unknown>;
                    const party = rec.accountingSupplierParty ?? rec.AccountingSupplierParty ?? rec.supplierParty ?? rec.SupplierParty ?? rec.senderParty ?? rec.SenderParty;
                    senderVknFromNes = extractVknFromObj(party) || extractVknFromObj(rec);
                  }
                } catch (_) {}
                if (!senderVknFromNes) {
                  for (const path of ["/v1/account", "/v1/profile", "/v1/users/me", "/v1/aliases"]) {
                    try {
                      const acc = await nesRequest(einvoiceBase, nesToken, "GET", path, undefined, 5000) as Record<string, unknown>;
                      const v = extractVknFromObj(acc) || (typeof acc?.vkn === "string" ? acc.vkn : null) || (typeof acc?.identifier === "string" ? acc.identifier : null);
                      if (typeof v === "string" && /^\d{10,11}$/.test(v.replace(/\D/g, ""))) {
                        senderVknFromNes = v.replace(/\D/g, "").slice(0, 11);
                        break;
                      }
                    } catch (_) { /* ignore */ }
                  }
                }
                const { data: freshRow } = await serviceClient
                  .from("edocument_settings")
                  .select("company_vkn, company_title")
                  .eq("tenant_id", tenant_id)
                  .maybeSingle();
                const settingsVkn = String((freshRow as { company_vkn?: string } | null)?.company_vkn ?? (settings as { company_vkn?: string }).company_vkn ?? "").trim().replace(/\D/g, "");
                const settingsTitle = String((freshRow as { company_title?: string } | null)?.company_title ?? (settings as { company_title?: string }).company_title ?? "").trim();
                const fromRequest = String((invoiceData as Record<string, unknown>)?.SenderVkn ?? "").trim().replace(/\D/g, "");
                const requestVknValid = fromRequest.length === 10 || fromRequest.length === 11;
                // Oncelik: 1) Istekte gonderilen (Kurulum'da gorunen), 2) DB'den taze okunan, 3) NES'ten
                const effectiveSenderVkn = (requestVknValid ? fromRequest : settingsVkn.length >= 10 ? settingsVkn : senderVknFromNes.length >= 10 ? senderVknFromNes : "") || "";
                if (!effectiveSenderVkn) {
                  return jsonResponse(
                    {
                      success: false,
                      error:
                        "Kurulumda 'Firma VKN' doldurulmali ve NES hesabinizdaki (API anahtari/Gonderici etiketi) firma VKN ile ayni olmali. " +
                        "Test ortami icin NES test kurum VKN (ornegin 1234567801) girin.",
                    },
                    400
                  );
                }
                const dataForUbl = { ...(invoiceData as Record<string, unknown>) };
                dataForUbl.SenderVkn = effectiveSenderVkn.length === 11 ? effectiveSenderVkn : effectiveSenderVkn.slice(0, 10);
                dataForUbl.SenderTitle = settingsTitle || "Firma";
                const ublXml = buildUblTrFromInvoiceData(dataForUbl);
                const form = new FormData();
                form.set("SenderAlias", senderAlias);
                form.set("File", new Blob([ublXml], { type: "application/xml" }), "invoice.xml");
                form.set("IsDirectSend", params.draft ? "false" : "true");
                form.set("PreviewType", "None");
                form.set("SourceApp", "project-bolt");
                form.set("AutoSaveCompany", "false");
                if (params.receiver_alias) form.set("ReceiverAlias", String(params.receiver_alias));
                result = await nesRequest(einvoiceBase, nesToken, "POST", "/v1/uploads/document", form, 30000);
              } catch (ublErr: unknown) {
                const ublMsg = ublErr instanceof Error ? ublErr.message : String(ublErr);
                const isVknMismatch = /VKN\/TCKN|UYUSMUYOR|gonderen kullanici/i.test(ublMsg);
                return jsonResponse(
                  {
                    success: false,
                    error: isVknMismatch
                      ? "Belge gonderici VKN, NES hesabinizdaki firma ile uyusmuyor. Kurulumda 'Firma VKN' alanina, NES portalinda giris yaptiginiz firmanin VKN numarasini yazin (test icin ornek: 1234567801 veya 1234567802) ve kaydedin."
                      : "E-Fatura gonderimi bu API adresinde bulunamadi (404). UBL-TR XML ile otomatik deneme de basarisiz: " + ublMsg + ". Kurulumda Gonderici etiketi (SenderAlias) dolu olmali.",
                  },
                  isVknMismatch ? 400 : 502
                );
              }
            } else if (is404) {
              return jsonResponse(
                {
                  success: false,
                  error:
                    "E-Fatura gonderimi bu API adresinde bulunamadi (404). " +
                    "Kurulumda Gonderici etiketi (SenderAlias) girin; form verisi UBL-TR XMLe cevrilip v1 yuklemesi denenir. " +
                    "Veya NES ile v2 API yolunu dogrulayin.",
                },
                404
              );
            } else {
              throw lastErr;
            }
          }
        } else {
          return jsonResponse(
            { success: false, error: "E-Fatura icin ubl_xml (UBL-TR XML) veya invoice_data gerekli." },
            400
          );
        }

        if (params.edocument_id) {
          const uuid = (result as any)?.uuid ?? (result as any)?.id;
          await serviceClient
            .from("edocuments")
            .update({
              status: params.draft ? "draft" : "queued",
              ettn: uuid ?? undefined,
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
        const ublXml = params.ubl_xml ?? params.ublXml;
        const senderAlias = (params.sender_alias ?? (settings as any).sender_alias ?? "").toString().trim();
        if (!ublXml || typeof ublXml !== "string") {
          return jsonResponse(
            { success: false, error: "ubl_xml (UBL-TR XML) gerekli." },
            400
          );
        }
        if (!senderAlias) {
          return jsonResponse(
            { success: false, error: "Gonderici etiketi (SenderAlias) gerekli." },
            400
          );
        }
        const form = new FormData();
        form.set("SenderAlias", senderAlias);
        form.set("File", new Blob([ublXml], { type: "application/xml" }), "invoice.xml");
        form.set("IsDirectSend", params.draft ? "false" : "true");
        form.set("PreviewType", "None");
        form.set("SourceApp", "project-bolt");
        form.set("AutoSaveCompany", "false");
        if (params.receiver_alias) form.set("ReceiverAlias", String(params.receiver_alias));
        result = await nesRequest(einvoiceBase, nesToken, "POST", "/v1/uploads/document", form, 30000);
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
        const begin = params.begin_date ?? params.startDate ?? "";
        const end = params.end_date ?? params.endDate ?? "";
        const raw = await nesRequest(
          einvoiceBase,
          nesToken,
          "GET",
          "/v1/incoming/invoices",
          undefined,
          20000,
          {
            sort: "CreatedAt desc",
            pageSize: params.pageSize ?? 100,
            page: params.page ?? 1,
            startDate: begin,
            endDate: end,
          }
        );
        result = normalizeIncomingInvoiceList(raw);
        break;
      }

      case "get_outgoing_invoices": {
        const begin = params.begin_date ?? params.startDate ?? "";
        const end = params.end_date ?? params.endDate ?? "";
        const raw = await nesRequest(
          einvoiceBase,
          nesToken,
          "GET",
          "/v1/outgoing/invoices",
          undefined,
          20000,
          {
            sort: "CreatedAt desc",
            pageSize: params.pageSize ?? 100,
            page: params.page ?? 1,
            startDate: begin,
            endDate: end,
          }
        );
        result = normalizeOutgoingInvoiceList(raw);
        break;
      }

      case "get_invoice_xml": {
        const uuid = (params.uuid ?? params.ettn ?? "").toString().trim();
        const direction = (params.direction ?? "outgoing").toString().toLowerCase();
        if (!uuid) {
          return jsonResponse({ success: false, error: "Belge uuid gerekli." }, 400);
        }
        const path = direction === "incoming"
          ? `/v1/incoming/invoices/${uuid}/xml`
          : `/v1/outgoing/invoices/${uuid}/xml`;
        result = await nesRequestText(einvoiceBase, nesToken, "GET", path, 15000);
        break;
      }

      case "get_invoice_html": {
        const uuid = (params.uuid ?? params.ettn ?? "").toString().trim();
        const direction = (params.direction ?? "outgoing").toString().toLowerCase();
        if (!uuid) {
          return jsonResponse({ success: false, error: "Belge uuid gerekli." }, 400);
        }
        const path = direction === "incoming"
          ? `/v1/incoming/invoices/${uuid}/html`
          : `/v1/outgoing/invoices/${uuid}/html`;
        result = await nesRequestText(einvoiceBase, nesToken, "GET", path, 15000);
        break;
      }

      case "set_transferred": {
        const uuids = Array.isArray(params.ettn_list) ? params.ettn_list : [];
        if (uuids.length === 0) {
          return jsonResponse({ success: false, error: "ettn_list (uuid listesi) gerekli." }, 400);
        }
        result = await nesRequest(
          einvoiceBase,
          nesToken,
          "PUT",
          "/v1/incoming/invoices/bulk/Transferred",
          uuids
        );
        break;
      }

      case "approve_draft": {
        const uuids = Array.isArray(params.ettn_list) ? params.ettn_list : [];
        if (uuids.length === 0) {
          return jsonResponse({ success: false, error: "ettn_list (taslak uuid listesi) gerekli." }, 400);
        }
        result = await nesRequest(
          einvoiceBase,
          nesToken,
          "POST",
          "/v1/uploads/draft/send",
          uuids
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
        const uuids = Array.isArray(params.ettn_list) ? params.ettn_list : [];
        if (uuids.length === 0) {
          return jsonResponse({ success: false, error: "ettn_list (taslak uuid listesi) gerekli." }, 400);
        }
        result = await nesRequest(
          einvoiceBase,
          nesToken,
          "DELETE",
          "/v1/outgoing/invoices/drafts",
          uuids
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
    const errMsg = message || (error instanceof Error ? error.message : String(error)) || "Bilinmeyen hata";
    return jsonResponse({ success: false, error: errMsg }, status);
  }
});
