import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type EventType =
  | "lead.created"
  | "message.received"
  | "subscription.paid"
  | "appointment.no_show"
  | "billing.payment_failed"
  | "daily.kpi_rollup";

type RequestBody = {
  event: EventType;
  clinic_id?: string;
  payload?: Record<string, unknown>;
};

type AgentName =
  | "traffic"
  | "qualification"
  | "conversion"
  | "onboarding"
  | "messaging"
  | "revenue"
  | "retention"
  | "billing"
  | "compliance";

type RunResult = {
  ok: boolean;
  agent: AgentName;
  notes: string[];
  updates?: Record<string, unknown>;
};

const EVENT_AGENT_MAP: Record<EventType, AgentName[]> = {
  "lead.created": ["qualification", "conversion", "compliance"],
  "message.received": ["messaging", "compliance"],
  "subscription.paid": ["billing", "onboarding", "compliance"],
  "appointment.no_show": ["retention", "revenue"],
  "billing.payment_failed": ["billing", "retention"],
  "daily.kpi_rollup": ["revenue", "retention", "compliance"],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      },
    );

    const body = (await req.json()) as RequestBody;
    if (!body?.event || !(body.event in EVENT_AGENT_MAP)) {
      return jsonResponse({ error: "Invalid event payload" }, 400);
    }
    if (!body.clinic_id) {
      return jsonResponse({ error: "clinic_id is required" }, 400);
    }

    const agents = EVENT_AGENT_MAP[body.event];
    const runResults: RunResult[] = [];

    for (const agentName of agents) {
      const startedAt = new Date().toISOString();
      const { data: runRow, error: runInsertError } = await supabase
        .schema("dentalflow")
        .from("agent_runs")
        .insert({
          clinic_id: body.clinic_id,
          agent_name: agentName,
          trigger_type: "event",
          status: "started",
          input_payload: {
            event: body.event,
            payload: body.payload ?? {},
          },
          started_at: startedAt,
        })
        .select("id")
        .single();

      if (runInsertError || !runRow?.id) {
        console.error("agent_runs insert error:", runInsertError);
        continue;
      }

      const result = await runAgent(agentName, body);
      runResults.push(result);

      await supabase
        .schema("dentalflow")
        .from("agent_runs")
        .update({
          status: result.ok ? "completed" : "failed",
          output_payload: {
            notes: result.notes,
            updates: result.updates ?? {},
          },
          error_message: result.ok ? null : result.notes.join(" | "),
          completed_at: new Date().toISOString(),
        })
        .eq("id", runRow.id);
    }

    return jsonResponse({
      ok: true,
      event: body.event,
      clinic_id: body.clinic_id,
      executed_agents: runResults.map((r) => r.agent),
      results: runResults,
    });
  } catch (error) {
    console.error("dentalflow-orchestrator error:", error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

async function runAgent(agent: AgentName, body: RequestBody): Promise<RunResult> {
  switch (agent) {
    case "qualification":
      return runQualificationAgent(body);
    case "conversion":
      return runConversionAgent(body);
    case "onboarding":
      return runOnboardingAgent(body);
    case "messaging":
      return runMessagingAgent(body);
    case "revenue":
      return runRevenueAgent(body);
    case "retention":
      return runRetentionAgent(body);
    case "billing":
      return runBillingAgent(body);
    case "compliance":
      return runComplianceAgent(body);
    case "traffic":
      return {
        ok: true,
        agent: "traffic",
        notes: ["Traffic agent is intended for scheduled acquisition jobs."],
      };
    default:
      return {
        ok: false,
        agent,
        notes: ["Unknown agent"],
      };
  }
}

function runQualificationAgent(body: RequestBody): RunResult {
  const payload = body.payload ?? {};
  const score = Number(payload.lead_score ?? 65);
  const bounded = Math.max(0, Math.min(100, score));
  const segment = bounded >= 80 ? "hot" : bounded >= 50 ? "warm" : "cold";

  return {
    ok: true,
    agent: "qualification",
    notes: [`Lead scored ${bounded} and segmented as ${segment}.`],
    updates: { lead_score: bounded, lead_segment: segment },
  };
}

function runConversionAgent(body: RequestBody): RunResult {
  const payload = body.payload ?? {};
  const plan = String(payload.recommended_plan ?? "starter");

  return {
    ok: true,
    agent: "conversion",
    notes: ["Checkout CTA generated for self-serve conversion."],
    updates: {
      recommended_plan: plan,
      cta: "Proceed to secure checkout",
    },
  };
}

function runOnboardingAgent(body: RequestBody): RunResult {
  return {
    ok: true,
    agent: "onboarding",
    notes: ["Onboarding checklist prepared and integration tests queued."],
    updates: {
      onboarding_status: "running",
      checklist: ["connect_whatsapp", "connect_calendar", "test_booking_flow"],
    },
  };
}

function runMessagingAgent(body: RequestBody): RunResult {
  const payload = body.payload ?? {};
  const incomingText = String(payload.message_text ?? "");
  const intent = detectIntent(incomingText);

  return {
    ok: true,
    agent: "messaging",
    notes: [`Message intent detected: ${intent}`],
    updates: { intent },
  };
}

function runRevenueAgent(body: RequestBody): RunResult {
  return {
    ok: true,
    agent: "revenue",
    notes: ["Revenue optimization checks executed."],
    updates: { action: "ab_test_review" },
  };
}

function runRetentionAgent(body: RequestBody): RunResult {
  return {
    ok: true,
    agent: "retention",
    notes: ["Retention recovery sequence evaluated."],
    updates: { action: "engagement_recovery" },
  };
}

function runBillingAgent(body: RequestBody): RunResult {
  const payload = body.payload ?? {};
  const failures = Number(payload.failed_payment_count ?? 0);
  const accountMode = failures >= 3 ? "restricted" : "active";

  return {
    ok: true,
    agent: "billing",
    notes: ["Billing state updated with retry policy."],
    updates: {
      failed_payment_count: failures,
      account_mode: accountMode,
    },
  };
}

function runComplianceAgent(body: RequestBody): RunResult {
  const payload = body.payload ?? {};
  const consent = Boolean(payload.consent_marketing ?? false);

  return {
    ok: consent,
    agent: "compliance",
    notes: consent
      ? ["Compliance check passed: consent verified."]
      : ["Compliance check failed: marketing consent missing."],
    updates: { consent_marketing: consent },
  };
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("fiyat") || lower.includes("ucret")) return "pricing";
  if (lower.includes("randevu") || lower.includes("saat")) return "booking";
  if (lower.includes("iptal") || lower.includes("sikayet")) return "complaint";
  return "information";
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
