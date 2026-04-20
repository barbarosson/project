# DentalFlow Autonomous Blueprint

This document defines a fully productized, self-serve system for dental clinics where sales and onboarding are handled by agents and workflows.

## 1) Product Scope

- Product: `DentalFlow AI`
- Market: Small and mid-size dental clinics in Turkey
- Promise: More booked appointments with lower no-show rates
- Delivery model: Self-serve SaaS (no live sales calls required)

## 2) Revenue Model

- Setup fee: optional (for premium onboarding)
- Monthly subscription:
  - Starter: 3,900 TRY
  - Growth: 7,900 TRY
  - Pro: 14,900 TRY
- Optional performance fee: booked or completed appointment based
- Upsell: ad optimization, conversion page optimization, premium reporting

## 3) System Architecture

- Frontend: Next.js app (signup, pricing, onboarding wizard, dashboard)
- Backend: Supabase Postgres + RLS + Edge Functions
- Automation: n8n or Make scenarios
- Channels: WhatsApp Business API, Instagram DM (official integrations), email
- Billing: Iyzico or Stripe subscriptions

## 4) Agent Roles and Boundaries

1. Traffic Agent
   - Creates and updates SEO content and paid campaign settings
   - Generates lead capture events
2. Qualification Agent
   - Validates lead identity and intent
   - Produces `lead_score` and segment
3. Conversion Agent
   - Recommends package and pushes checkout link
   - Handles objections with pre-approved policy
4. Onboarding Agent
   - Collects clinic setup details
   - Connects channels, activates reminders
5. Messaging Agent
   - Runs incoming/outgoing conversation playbooks
   - Books appointment slots
6. Revenue Agent
   - Runs A/B tests and campaign changes to fill idle slots
7. Retention Agent
   - Detects churn risk and applies recovery playbooks
8. Billing Agent
   - Handles recurring billing, retries, dunning flow
9. Compliance Agent
   - Enforces consent, rate limits, and audit logging

## 5) Event-Driven Flow (Lead to Revenue)

1. Lead submitted (`website`, `whatsapp`, `instagram`, `ads`)
2. Qualification Agent scores lead and sets segment
3. Conversion Agent sends package recommendation + checkout
4. On successful payment, Onboarding Agent starts setup
5. Messaging Agent handles inquiries and books appointments
6. Reminder jobs reduce no-show risk
7. KPI aggregation updates daily clinic metrics
8. Retention and Revenue agents optimize based on thresholds

## 6) Critical Automation Rules

- If `lead_score >= 80`, route to high-priority conversion script
- If `no_show_rate > 25%`, increase reminder frequency
- If payment fails 3 times, switch account to restricted mode
- If conversion drops by 20% week over week, trigger A/B campaign
- If clinic inactive for 7 days, Retention Agent starts recovery flow

## 7) Compliance and Safety Constraints

- Every outbound message requires consent status check
- All automated decisions must be written to `agent_runs` table
- Rate limits per channel must be enforced to avoid account penalties
- Human override must remain available for legal disputes and billing conflicts

## 8) Build Sequence

1. Apply DB migration (`dentalflow` schema)
2. Build onboarding + clinic dashboard
3. Integrate billing provider and webhook handlers
4. Deploy first automation scenarios (qualification, conversion, reminders)
5. Enable KPI and churn monitoring rules
6. Launch paid acquisition loops and optimize CAC/LTV
