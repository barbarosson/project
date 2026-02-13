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
        JSON.stringify({ error: "Missing authorization header" }),
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

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user: callerUser },
      error: authError,
    } = await userClient.auth.getUser(token);
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: callerProfile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (
      !callerProfile ||
      (callerProfile.role !== "admin" && callerProfile.role !== "super_admin")
    ) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const {
      email,
      password,
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

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "email and password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validRoles = ["user", "admin", "super_admin"];
    const userRole = validRoles.includes(role) ? role : "user";

    if (
      userRole === "super_admin" &&
      callerProfile.role !== "super_admin"
    ) {
      return new Response(
        JSON.stringify({
          error: "Only super admins can create super admin users",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || "" },
      });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const validPlans = ["STARTER", "ADVANCED", "ENTERPRISE"];
    const selectedPlan = validPlans.includes(plan_name) ? plan_name : "STARTER";
    const subStatus =
      plan_status === "active" ||
      plan_status === "cancelled" ||
      plan_status === "expired"
        ? plan_status
        : "active";

    const { data: existingTenant } = await adminClient
      .from("tenants")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    let tenantRowId = existingTenant?.id;

    if (!tenantRowId) {
      const { data: newTenant, error: tenantError } = await adminClient
        .from("tenants")
        .insert({
          id: userId,
          name: company_name || full_name || email,
          owner_id: userId,
          settings: {
            currency: "TRY",
            language: "tr",
            plan: selectedPlan.toLowerCase(),
            plan_started_at: new Date().toISOString(),
            trial_ends_at: null,
          },
        })
        .select("id")
        .single();

      if (tenantError) {
        console.error("Tenant creation error:", tenantError);
        return new Response(
          JSON.stringify({ error: "Tenant oluşturulamadı: " + tenantError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      tenantRowId = newTenant.id;
    }

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: userId,
      email,
      full_name: full_name || null,
      phone: phone || null,
      company_name: company_name || null,
      role: userRole,
      tenant_id: tenantRowId,
      is_active: true,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return new Response(
        JSON.stringify({ error: "Profil oluşturulamadı: " + profileError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: companyError } = await adminClient
      .from("company_settings")
      .upsert({
        tenant_id: tenantRowId,
        company_name: company_name || full_name || email,
        email: email,
        currency: "TRY",
      });

    if (companyError) {
      console.error("Company settings error:", companyError);
    }

    const { error: subError } = await adminClient
      .from("user_subscriptions")
      .upsert({
        user_id: userId,
        plan_name: selectedPlan,
        status: subStatus,
        started_at: new Date().toISOString(),
        expires_at: plan_expires_at || null,
        payment_method: payment_method || null,
        auto_renew: auto_renew !== false,
      });

    if (subError) {
      console.error("Subscription creation error:", subError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email,
        role: userRole,
        plan: selectedPlan,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
