import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user: callerUser },
      error: authError,
    } = await authClient.auth.getUser(token);
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({
          error: "Gecersiz veya suresi dolmus oturum. Lutfen cikis yapip tekrar giris yapin.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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

    const body = await req.json();
    const {
      userId,
      email,
      full_name,
      phone,
      company_name,
      role,
      plan_name,
      plan_status,
      plan_expires_at,
      payment_method,
      auto_renew,
    } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId zorunludur" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validRoles = ["user", "super_admin"];
    const newRole = role && validRoles.includes(role) ? role : undefined;

    if (newRole === "super_admin" && callerProfile.role !== "super_admin") {
      return new Response(
        JSON.stringify({
          error: "Sadece super adminler super admin rolu atayabilir",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (email) {
      const { error: emailError } =
        await adminClient.auth.admin.updateUserById(userId, {
          email,
          email_confirm: true,
        });

      if (emailError) {
        return new Response(
          JSON.stringify({
            error: "E-posta guncellenemedi: " + emailError.message,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const profileUpdates: Record<string, unknown> = {};
    if (email !== undefined) profileUpdates.email = email;
    if (full_name !== undefined) profileUpdates.full_name = full_name || null;
    if (phone !== undefined) profileUpdates.phone = phone || null;
    if (company_name !== undefined)
      profileUpdates.company_name = company_name || null;
    if (newRole) profileUpdates.role = newRole;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await adminClient
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (profileError) {
        return new Response(
          JSON.stringify({
            error: "Profil guncellenemedi: " + profileError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (company_name !== undefined) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("tenant_id")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.tenant_id) {
        await adminClient
          .from("company_settings")
          .update({ company_name: company_name || "" })
          .eq("tenant_id", profile.tenant_id);

        await adminClient
          .from("tenants")
          .update({ name: company_name || "" })
          .eq("id", profile.tenant_id);
      }
    }

    const validPlans = ["FREE", "KUCUK", "ORTA", "BUYUK", "ENTERPRISE"];
    const validStatuses = ["active", "cancelled", "expired"];
    const subUpdates: Record<string, unknown> = {};

    if (newRole === "super_admin") {
      subUpdates.plan_name = "ENTERPRISE";
    } else if (plan_name && validPlans.includes(plan_name)) {
      subUpdates.plan_name = plan_name;
    }
    if (plan_status && validStatuses.includes(plan_status))
      subUpdates.status = plan_status;
    if (plan_expires_at !== undefined)
      subUpdates.expires_at = plan_expires_at || null;
    if (payment_method !== undefined)
      subUpdates.payment_method = payment_method || null;
    if (auto_renew !== undefined) subUpdates.auto_renew = auto_renew;

    if (newRole === "super_admin") {
      const { error: upsertErr } = await adminClient
        .from("user_subscriptions")
        .upsert({
          user_id: userId,
          plan_name: "ENTERPRISE",
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: null,
          payment_method: null,
          auto_renew: true,
        }, { onConflict: "user_id" });
      if (upsertErr) {
        return new Response(
          JSON.stringify({ error: "Abonelik atanmadi: " + upsertErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (Object.keys(subUpdates).length > 0) {
      const { error: subError } = await adminClient
        .from("user_subscriptions")
        .update(subUpdates)
        .eq("user_id", userId);

      if (subError) {
        return new Response(
          JSON.stringify({
            error: "Abonelik guncellenemedi: " + subError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
