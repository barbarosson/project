import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminEmails = [
      "admin@modulus.com",
      "erp.songur@gmail.com"
    ];

    const newPassword = "Admin123456!";
    const results = [];

    for (const email of adminEmails) {
      // Get user by email
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error(`Error listing users:`, listError);
        results.push({ email, success: false, error: listError.message });
        continue;
      }

      const user = users.users.find(u => u.email === email);

      if (!user) {
        console.error(`User not found: ${email}`);
        results.push({ email, success: false, error: "User not found" });
        continue;
      }

      // Update user password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error(`Error updating password for ${email}:`, updateError);
        results.push({ email, success: false, error: updateError.message });
      } else {
        console.log(`Password updated successfully for ${email}`);
        results.push({ email, success: true });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Password update completed",
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating admin passwords:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
