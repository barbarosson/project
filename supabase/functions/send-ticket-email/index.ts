import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface TicketData {
  ticket_number: string
  subject: string
  category: string
  priority: string
  message: string
  user_email: string
  user_name: string
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { ticketData }: { ticketData: TicketData } = await req.json()

    if (!ticketData) {
      return new Response(
        JSON.stringify({ error: "Missing ticket data" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; margin-top: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
            .badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 14px; color: white; }
            .badge-high { background: #dc3545; }
            .badge-medium { background: #ffc107; color: #333; }
            .badge-low { background: #28a745; }
            .message-box { background: white; padding: 15px; border-radius: 5px; border-left: 3px solid #2ECC71; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🎫 New Support Ticket</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">ModulusTech Helpdesk</p>
            </div>
            <div class="content">
              <div style="margin-bottom: 20px;">
                <span class="badge badge-${ticketData.priority === 'high' ? 'high' : ticketData.priority === 'medium' ? 'medium' : 'low'}">
                  ${ticketData.priority.toUpperCase()} PRIORITY
                </span>
              </div>

              <div class="field">
                <div class="label">🎫 Ticket Number:</div>
                <div class="value" style="font-size: 18px; font-weight: bold; color: #2ECC71;">${ticketData.ticket_number}</div>
              </div>

              <div class="field">
                <div class="label">👤 From:</div>
                <div class="value">${ticketData.user_name}</div>
              </div>

              <div class="field">
                <div class="label">📧 Email:</div>
                <div class="value">${ticketData.user_email}</div>
              </div>

              <div class="field">
                <div class="label">📂 Category:</div>
                <div class="value">${ticketData.category}</div>
              </div>

              <div class="field">
                <div class="label">📋 Subject:</div>
                <div class="value" style="font-size: 16px; font-weight: 600;">${ticketData.subject}</div>
              </div>

              <div class="field">
                <div class="label">💬 Message:</div>
                <div class="message-box">${ticketData.message.replace(/\n/g, '<br>')}</div>
              </div>

              <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                <strong>⚡ Action Required:</strong>
                <p style="margin: 10px 0 0 0;">Please respond to this ticket via the ModulusTech admin panel.</p>
              </div>
            </div>
            <div class="footer">
              <p>ModulusTech Helpdesk - Support Ticket Notification</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured. Skipping email notification.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Ticket received (email not configured)"
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
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ModulusTech Helpdesk <noreply@modulus.app>",
        to: ["info@modulus.app"],
        reply_to: ticketData.user_email,
        subject: `🎫 New Support Ticket #${ticketData.ticket_number} - ${ticketData.subject}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email notification");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Ticket email notification sent successfully"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )

  } catch (error) {
    console.error("Error processing ticket email:", error)

    return new Response(
      JSON.stringify({
        error: "Failed to process ticket email",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})
