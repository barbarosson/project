import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-customer-header, x-supabase-auth",
};

interface OCRResponse {
  vendor_name: string;
  date: string;
  total_amount: number;
  tax_amount: number | null;
  category: string;
  description: string;
  currency: string;
  confidence: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    console.log("[OCR] Handling OPTIONS preflight request");
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log("[OCR] 🟢 Incoming request:", req.method);
    console.log("[OCR] 🟢 Function deployed with MANUAL AUTH (Gateway JWT disabled)");

    const authHeader = req.headers.get("Authorization");
    const apikeyHeader = req.headers.get("apikey");

    console.log("[OCR] Headers received:");
    console.log("[OCR]   Authorization:", authHeader ? "✓ Present" : "❌ Missing");
    console.log("[OCR]   apikey:", apikeyHeader ? "✓ Present" : "❌ Missing");
    console.log("[OCR]   All headers:", Array.from(req.headers.keys()).join(", "));

    if (!authHeader) {
      console.error("[OCR] ❌ Missing Authorization header");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Missing Authorization header"
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[OCR] ✓ Auth header present");
    console.log("[OCR] Token preview:", authHeader.substring(0, 17) + "...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

    console.log("[OCR] Environment check:");
    console.log("[OCR]   SUPABASE_URL:", supabaseUrl ? `✓ Set (${supabaseUrl})` : "❌ Missing");
    console.log("[OCR]   SUPABASE_ANON_KEY:", supabaseKey ? "✓ Set (length: " + supabaseKey.length + ")" : "❌ Missing");
    console.log("[OCR]   OPENAI_API_KEY:", openaiKey ? "✓ Set" : "❌ Missing");

    if (!supabaseUrl || !supabaseKey) {
      console.error("[OCR] ❌ Missing Supabase environment variables");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Supabase credentials"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[OCR] 🔍 Creating Supabase client and verifying JWT...");

    const client = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    let authError: any;
    let user: any;

    try {
      const result = await client.auth.getUser();
      user = result.data?.user;
      authError = result.error;

      console.log("[OCR] JWT Verification Result:", {
        hasUser: !!user,
        hasError: !!authError,
        errorName: authError?.name,
        errorMessage: authError?.message,
        errorStatus: authError?.status,
      });
    } catch (err: any) {
      console.error("[OCR] ❌ JWT Verification Exception:", err);
      authError = err;
    }

    if (authError || !user) {
      const errorDetails = {
        message: authError?.message || "Invalid or expired token",
        name: authError?.name || "AuthError",
        status: authError?.status || "unknown",
      };

      console.error("[OCR] ❌ Auth verification failed:", errorDetails);

      let userFriendlyError = "Unauthorized: ";
      if (authError?.message?.includes("expired")) {
        userFriendlyError += "JWT Expired - Token has expired, please refresh";
      } else if (authError?.message?.includes("signature")) {
        userFriendlyError += "JWT Signature Mismatch - Invalid token signature";
      } else if (authError?.message?.includes("invalid")) {
        userFriendlyError += "Invalid JWT - Token format is invalid";
      } else {
        userFriendlyError += authError?.message || "Invalid or expired token";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: userFriendlyError,
          details: errorDetails,
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[OCR] ✓ Authenticated user:", user.id);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("[OCR] OpenAI API key not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: AI service not configured. Please contact administrator."
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();
    const { image_base64, tenant_id } = body;

    if (!tenant_id) {
      throw new Error("Missing tenant_id");
    }

    if (!image_base64) {
      throw new Error("Missing image data");
    }

    console.log("[OCR] Processing receipt for tenant:", tenant_id);

    const systemPrompt = `You are an expert OCR system specialized in extracting structured data from receipts and invoices.

Analyze the provided receipt/invoice image and extract the following information in JSON format:

{
  "vendor_name": "Name of the store/company",
  "date": "Date on receipt in YYYY-MM-DD format",
  "total_amount": 0.00,
  "tax_amount": 0.00,
  "category": "one of: general, marketing, personnel, office, tax, utilities, rent, other",
  "description": "Brief description of purchase",
  "currency": "TRY, USD, EUR, or GBP",
  "confidence": 0.95
}

RULES:
1. Extract ONLY the total/final amount, not line items
2. If VAT/KDV is shown separately, extract it to tax_amount
3. Detect currency symbol (₺ = TRY, $ = USD, € = EUR, £ = GBP)
4. For category, infer from vendor name:
   - Restaurants/Cafes → general
   - Office supplies/equipment → office
   - Advertising/Marketing services → marketing
   - Salaries/Benefits → personnel
   - Internet/Phone/Electric → utilities
   - Property/Building → rent
   - Government fees → tax
   - Default → other
5. Set confidence (0.0-1.0) based on image quality and data clarity
6. If date format is ambiguous, use DD/MM/YYYY format common in Turkey
7. Return ONLY valid JSON, no extra text

If you cannot read the receipt clearly, return:
{
  "error": "Could not parse receipt clearly",
  "confidence": 0.0
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract expense data from this receipt:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[OCR] OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    console.log("[OCR] Raw AI response:", content);

    let ocrData: OCRResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ocrData = JSON.parse(jsonMatch[0]);
      } else {
        ocrData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("[OCR] Failed to parse AI response:", parseError);
      throw new Error("Failed to parse receipt data");
    }

    if (ocrData.error) {
      throw new Error(ocrData.error);
    }

    if (ocrData.confidence < 0.5) {
      throw new Error("Low confidence in OCR results, please verify manually");
    }

    console.log("[OCR] Success:", {
      vendor: ocrData.vendor_name,
      amount: ocrData.total_amount,
      confidence: ocrData.confidence
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: ocrData
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[OCR] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process receipt"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
