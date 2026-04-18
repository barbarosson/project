// =====================================================================
// AppointFlow — autonomous orchestrator (Supabase Edge Function / Deno)
// ---------------------------------------------------------------------
// The Next.js API writes domain events (booking created, WA inbound,
// Stripe paid, daily KPI rollup, …) and forwards them here. This function
// dispatches them to the relevant agents, each of which writes an
// agent_runs row and can mutate DB state directly via the service role.
// =====================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, x-apptflow-secret",
};

type EventType =
  | "lead.created"
  | "appointment.created"
  | "appointment.cancelled"
  | "appointment.completed"
  | "appointment.no_show"
  | "whatsapp.inbound"
  | "whatsapp.delivery"
  | "subscription.created"
  | "subscription.payment_failed"
  | "subscription.paid"
  | "daily.kpi_rollup"
  | "campaign.tick"
  | "pricing.recheck";

type AgentName =
  | "growth" | "qualification" | "conversion" | "onboarding"
  | "messaging" | "scheduling" | "reminders" | "retention"
  | "billing" | "pricing" | "compliance";

type Body = {
  event: EventType;
  tenant_id: string | null;
  payload?: Record<string, unknown>;
};

// Which agents react to each event. Agents run sequentially so later
// agents can observe the earlier ones' writes; the loop tolerates
// individual failures and records them.
const PLAYBOOK: Record<EventType, AgentName[]> = {
  "lead.created":                ["qualification", "conversion", "compliance"],
  "appointment.created":         ["scheduling", "messaging", "reminders"],
  "appointment.cancelled":       ["retention", "messaging"],
  "appointment.completed":       ["retention", "messaging"],
  "appointment.no_show":         ["retention", "pricing"],
  "whatsapp.inbound":            ["messaging", "scheduling", "compliance"],
  "whatsapp.delivery":           ["compliance"],
  "subscription.created":        ["onboarding", "billing"],
  "subscription.payment_failed": ["billing", "retention"],
  "subscription.paid":           ["billing"],
  "daily.kpi_rollup":            ["growth", "pricing", "retention"],
  "campaign.tick":               ["growth"],
  "pricing.recheck":             ["pricing", "billing"],
};

type AgentResult = {
  ok: boolean;
  agent: AgentName;
  notes: string[];
  updates?: Record<string, unknown>;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  // Shared-secret check so the function can only be triggered by the
  // trusted Next.js API (or a cron job that knows the secret).
  const secret = Deno.env.get("APPTFLOW_WEBHOOK_SECRET") ?? "";
  const presented = req.headers.get("x-apptflow-secret") ?? "";
  if (!secret || !presented || presented !== secret) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: "apptflow" } },
  );

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }
  if (!body?.event || !(body.event in PLAYBOOK)) {
    return jsonResponse({ ok: false, error: "invalid_event" }, 400);
  }

  const agents = PLAYBOOK[body.event];
  const results: AgentResult[] = [];

  for (const agent of agents) {
    const { data: runRow } = await supabase
      .from("agent_runs")
      .insert({
        tenant_id: body.tenant_id,
        agent_name: agent,
        trigger_type: "event",
        status: "started",
        input_payload: { event: body.event, payload: body.payload ?? {} },
      })
      .select("id")
      .single();

    let res: AgentResult;
    try {
      res = await runAgent(agent, body, supabase);
    } catch (err) {
      res = { ok: false, agent, notes: [(err as Error).message] };
    }
    results.push(res);

    if (runRow?.id) {
      await supabase
        .from("agent_runs")
        .update({
          status: res.ok ? "completed" : "failed",
          output_payload: { notes: res.notes, updates: res.updates ?? {} },
          error_message: res.ok ? null : res.notes.join(" | "),
          completed_at: new Date().toISOString(),
        })
        .eq("id", runRow.id);
    }
  }

  return jsonResponse({
    ok: true,
    event: body.event,
    tenant_id: body.tenant_id,
    executed_agents: results.map((r) => r.agent),
    results,
  });
});

// =====================================================================
// Agents
// =====================================================================

async function runAgent(
  agent: AgentName, body: Body, sb: SupabaseClient,
): Promise<AgentResult> {
  switch (agent) {
    case "qualification": return qualificationAgent(body, sb);
    case "conversion":    return conversionAgent(body, sb);
    case "onboarding":    return onboardingAgent(body, sb);
    case "messaging":     return messagingAgent(body, sb);
    case "scheduling":    return schedulingAgent(body, sb);
    case "reminders":     return { ok: true, agent, notes: ["reminders handled by cron"] };
    case "retention":     return retentionAgent(body, sb);
    case "billing":       return billingAgent(body, sb);
    case "pricing":       return pricingAgent(body, sb);
    case "compliance":    return complianceAgent(body, sb);
    case "growth":        return growthAgent(body, sb);
  }
}

async function qualificationAgent(body: Body, sb: SupabaseClient): Promise<AgentResult> {
  const p = body.payload ?? {};
  const leadId = p.lead_id as string | undefined;
  if (!leadId) return { ok: true, agent: "qualification", notes: ["no lead_id"] };

  const hasPhone = Boolean(p.phone_e164);
  const hasEmail = Boolean(p.email);
  const sourceWeight: Record<string, number> = {
    referral: 30, landing: 20, whatsapp: 15, import: 5,
  };
  const base = sourceWeight[(p.source as string) ?? "landing"] ?? 10;
  const score = Math.min(100, base + (hasPhone ? 30 : 0) + (hasEmail ? 20 : 0));
  const stage = score >= 70 ? "qualified" : score >= 40 ? "engaged" : "new";

  await sb.from("leads").update({ score, stage }).eq("id", leadId);
  return { ok: true, agent: "qualification", notes: [`scored ${score}, stage=${stage}`], updates: { score, stage } };
}

async function conversionAgent(_body: Body, _sb: SupabaseClient): Promise<AgentResult> {
  return { ok: true, agent: "conversion", notes: ["self-serve CTA handled on web"] };
}

async function onboardingAgent(body: Body, sb: SupabaseClient): Promise<AgentResult> {
  if (!body.tenant_id) return { ok: true, agent: "onboarding", notes: ["no tenant"] };
  await sb.from("tenants").update({ status: "active" }).eq("id", body.tenant_id);
  return { ok: true, agent: "onboarding", notes: ["tenant marked active"] };
}

async function messagingAgent(body: Body, _sb: SupabaseClient): Promise<AgentResult> {
  // Heavy NLU lives in Next.js where we have the i18n catalog; here
  // we only acknowledge the event for the audit trail.
  return {
    ok: true,
    agent: "messaging",
    notes: [`intent=${body.payload?.intent ?? "n/a"}`],
  };
}

async function schedulingAgent(body: Body, _sb: SupabaseClient): Promise<AgentResult> {
  return {
    ok: true,
    agent: "scheduling",
    notes: [`appointment event=${body.event}`],
  };
}

async function retentionAgent(body: Body, sb: SupabaseClient): Promise<AgentResult> {
  if (body.event === "appointment.no_show" && body.tenant_id) {
    // Create/refresh a reactivation campaign for no-show customers.
    const { data: existing } = await sb
      .from("campaigns")
      .select("id, status")
      .eq("tenant_id", body.tenant_id)
      .eq("goal", "reactivation")
      .eq("channel", "whatsapp")
      .maybeSingle();

    if (!existing) {
      await sb.from("campaigns").insert({
        tenant_id: body.tenant_id,
        name: "No-show reactivation",
        goal: "reactivation",
        channel: "whatsapp",
        audience_query: { kind: "customers_last_seen_days_gte", days: 30 },
        message_body: "We missed you! Book your next visit with 15% off.",
        budget_usd: 5,
        status: "running",
      });
    } else if (existing.status === "paused") {
      await sb.from("campaigns").update({ status: "running" }).eq("id", existing.id);
    }
  }
  return { ok: true, agent: "retention", notes: [`event=${body.event}`] };
}

async function billingAgent(body: Body, sb: SupabaseClient): Promise<AgentResult> {
  if (!body.tenant_id) return { ok: true, agent: "billing", notes: ["no tenant"] };
  if (body.event === "subscription.payment_failed") {
    const failures = Number(body.payload?.failed_payment_count ?? 0);
    if (failures >= 3) {
      await sb.from("tenants").update({ status: "paused" }).eq("id", body.tenant_id);
      return { ok: true, agent: "billing", notes: [`tenant paused after ${failures} failures`] };
    }
  }
  if (body.event === "subscription.paid") {
    await sb.from("subscriptions").update({ failed_payment_count: 0, status: "active" }).eq("tenant_id", body.tenant_id);
  }
  return { ok: true, agent: "billing", notes: [`event=${body.event}`] };
}

async function pricingAgent(body: Body, sb: SupabaseClient): Promise<AgentResult> {
  if (body.event !== "pricing.recheck" || !body.tenant_id) {
    return { ok: true, agent: "pricing", notes: ["noop"] };
  }
  const required = Number(body.payload?.required_price_usd ?? 0);
  const margin = Number(body.payload?.margin ?? 0);
  // Flag the subscription for upgrade. Actual plan change is handled by
  // a Next.js job that can interact with Stripe.
  await sb.from("agent_runs").insert({
    tenant_id: body.tenant_id,
    agent_name: "pricing",
    trigger_type: "event",
    status: "completed",
    input_payload: { required_usd: required, margin },
    output_payload: { action: "queue_upgrade_proposal" },
  });
  return {
    ok: true,
    agent: "pricing",
    notes: [`tenant under margin (${margin.toFixed(3)}), required ≥ $${required.toFixed(2)}/mo`],
  };
}

async function complianceAgent(body: Body, _sb: SupabaseClient): Promise<AgentResult> {
  // Minimal: confirm marketing consent on outbound touchpoints.
  if (body.event === "lead.created") {
    const consent = Boolean(body.payload?.consent_marketing ?? false);
    return {
      ok: true,
      agent: "compliance",
      notes: [consent ? "consent on" : "consent missing (transactional only)"],
    };
  }
  return { ok: true, agent: "compliance", notes: [`event=${body.event}`] };
}

async function growthAgent(body: Body, sb: SupabaseClient): Promise<AgentResult> {
  // Platform-level acquisition: if there are stale 'draft' campaigns
  // older than 24h, auto-activate them.
  const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: activated } = await sb
    .from("campaigns")
    .update({ status: "running" })
    .eq("status", "draft")
    .lt("created_at", cutoff)
    .select("id");
  return {
    ok: true,
    agent: "growth",
    notes: [`activated ${activated?.length ?? 0} stale campaigns`],
  };
}

// =====================================================================
// utils
// =====================================================================

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
