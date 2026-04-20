# DentalFlow Implementation Checklist

## Environment Variables

Set these values before testing:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DENTALFLOW_WEBHOOK_SECRET`
- `DENTALFLOW_ORCHESTRATOR_URL` (optional, defaults to Supabase functions URL)
- `NEXT_PUBLIC_SITE_URL`
- `DENTALFLOW_DEFAULT_CLINIC_ID` (used by n8n daily trigger)

## Deploy Sequence

1. Run migration to create `dentalflow` schema tables
2. Deploy edge function:
   - `supabase functions deploy dentalflow-orchestrator`
3. Configure function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Configure Next.js API environment variables
5. Import `docs/DENTALFLOW_N8N_WORKFLOW.json` into n8n
6. Configure n8n env vars and activate workflow

## Smoke Test

Run this request against Next.js:

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/dentalflow/events" \
  -H "Content-Type: application/json" \
  -H "x-dentalflow-secret: $DENTALFLOW_WEBHOOK_SECRET" \
  -d '{
    "event": "lead.created",
    "clinic_id": "REPLACE_WITH_CLINIC_UUID",
    "payload": {
      "lead_score": 84,
      "consent_marketing": true,
      "message_text": "Fiyat ve randevu bilgisi alabilir miyim?"
    }
  }'
```

Expected result:
- `ok: true`
- `executed_agents` includes `qualification`, `conversion`, `compliance`
- New entries in `dentalflow.agent_runs`

## Known Limits (Current Version)

- Agent logic uses deterministic rules (not LLM calls yet)
- Conversion and messaging outputs are placeholders for channel adapters
- Billing actions require provider webhook implementation
