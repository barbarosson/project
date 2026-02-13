import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("=== DEMO REQUEST EMAIL FUNCTION STARTED ===");

    const { fullName, email, companyName, phone, industry, message } = await req.json();

    if (!fullName || !email || !companyName) {
      console.warn("Missing required fields:", { fullName, email, companyName });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Received demo request data:");
    console.log("- Full Name:", fullName);
    console.log("- Email:", email);
    console.log("- Company:", companyName);
    console.log("- Phone:", phone || "N/A");
    console.log("- Industry:", industry || "N/A");

    // Check API Key
    if (!RESEND_API_KEY) {
      console.error("CRITICAL: RESEND_API_KEY is not set in environment variables!");
      return new Response(
        JSON.stringify({
          error: "Email service not configured",
          success: false
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("RESEND_API_KEY status: Loaded");

    // Send email notification to info@modulus.app
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00D4AA 0%, #00B894 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; margin-top: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
            .badge { display: inline-block; background: #00D4AA; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🎉 New Demo Request</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">ModulusTech ERP System</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">
                <span class="badge">New Request</span>
              </p>

              <div class="field">
                <div class="label">👤 Full Name:</div>
                <div class="value">${fullName}</div>
              </div>

              <div class="field">
                <div class="label">📧 Email:</div>
                <div class="value">${email}</div>
              </div>

              <div class="field">
                <div class="label">🏢 Company:</div>
                <div class="value">${companyName}</div>
              </div>

              ${phone ? `
              <div class="field">
                <div class="label">📱 Phone:</div>
                <div class="value">${phone}</div>
              </div>
              ` : ''}

              ${industry ? `
              <div class="field">
                <div class="label">🏭 Industry:</div>
                <div class="value">${industry}</div>
              </div>
              ` : ''}

              ${message ? `
              <div class="field">
                <div class="label">💬 Message:</div>
                <div class="value" style="background: white; padding: 15px; border-radius: 5px; border-left: 3px solid #00D4AA;">${message.replace(/\n/g, '<br>')}</div>
              </div>
              ` : ''}

              <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <strong>⚡ Next Steps:</strong>
                <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Review the demo request in admin panel</li>
                  <li>Approve to create demo account with sample data</li>
                  <li>Share credentials with the customer</li>
                </ol>
              </div>
            </div>
            <div class="footer">
              <p>ModulusTech ERP System - Demo Request Notification</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Preparing to send email with Resend API...");
    console.log("- From: ModulusTech <info@modulustech.app>");
    console.log("- To: info@modulustech.app");
    console.log("- Subject: New Demo Request from", companyName);

    const emailPayload = {
      from: "onboarding@resend.dev",
      to: ["delivered@resend.dev"],
      subject: `New Demo Request from ${companyName}`,
      html: emailHtml,
      reply_to: email,
    };

    console.log("Sending POST request to https://api.resend.com/emails");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await emailResponse.json();
    console.log("Resend API Response Status:", emailResponse.status);
    console.log("Resend API Response Data:", JSON.stringify(responseData, null, 2));

    if (!emailResponse.ok) {
      console.error("ERROR: Email send failed!");
      console.error("- HTTP Status:", emailResponse.status);
      console.error("- Error Details:", responseData);
      return new Response(
        JSON.stringify({
          error: "Failed to send email notification",
          details: responseData,
          status: emailResponse.status,
          success: false
        }),
        {
          status: emailResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("SUCCESS: Email sent!");
    console.log("- Email ID:", responseData.id);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email notification sent successfully",
        id: responseData.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("=== CRITICAL ERROR ===");
    console.error("Error Type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error Message:", error instanceof Error ? error.message : String(error));
    console.error("Full Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
