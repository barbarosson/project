# DentalFlow Workflow Steps (Autonomous Mode)

## Trigger Types

- `lead.created`
- `subscription.paid`
- `message.received`
- `appointment.no_show`
- `billing.payment_failed`
- `daily.kpi_rollup`

## Step-by-Step Runtime Flow

1. `lead.created`
   - Qualification Agent reads lead fields
   - Computes score and segment
   - Stores result in `dentalflow.leads`
2. Conversion run
   - Conversion Agent picks approved script
   - Sends package recommendation with checkout link
   - Writes outbound message to `dentalflow.conversations`
3. Checkout webhook (`subscription.paid`)
   - Billing Agent activates subscription
   - Onboarding Agent launches setup checklist
4. Onboarding checks
   - Validate channel credentials
   - Create default automation rules
   - Run test message and test booking
5. Messaging runtime (`message.received`)
   - Classify intent
   - Generate response
   - Book slot if booking intent detected
   - Save all events to conversations + appointments
6. Reminder and no-show loop
   - Scheduled reminders (24h and 2h before)
   - If no-show detected, Retention Agent starts recovery sequence
7. Daily KPI rollup
   - Aggregate leads, bookings, completions, no-show, revenue
   - Persist to `dentalflow.kpi_daily`
8. Optimization loop
   - Revenue Agent checks conversion deltas
   - Runs A/B tests under guardrails
9. Billing failure loop
   - Retry payment
   - Send dunning messages
   - Restrict account after max failure count
10. Compliance checks
   - Validate consent before promo sends
   - Enforce channel rate limits
   - Log all blocked actions

## Guardrails

- Hard stop promotional messages without consent
- Limit each clinic's outbound rate per hour/day
- Require human approval for legal complaints and refund disputes
- Keep immutable audit records for agent decisions
