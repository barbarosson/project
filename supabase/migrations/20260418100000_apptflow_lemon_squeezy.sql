-- AppointFlow: switch billing from Stripe to Lemon Squeezy (Merchant of Record)
--
-- Lemon Squeezy acts as the merchant and handles VAT/GST remittance in 140+
-- countries, so AppointFlow only needs to track the external subscription
-- identifier + the customer id (for portal/cancel deep-links).
--
-- We keep the existing stripe_* columns for a deprecation window. They can
-- be dropped once no subscription references them (planned: +90 days).

alter table apptflow.subscriptions
  add column if not exists lemon_subscription_id text unique,
  add column if not exists lemon_customer_id     text,
  add column if not exists lemon_variant_id      text,
  add column if not exists lemon_order_id        text;

create index if not exists subscriptions_lemon_customer_idx
  on apptflow.subscriptions (lemon_customer_id);

-- Same on pricing_plans (for dashboard admin workflows that want a direct
-- Lemon product id).
alter table apptflow.pricing_plans
  add column if not exists lemon_product_id text;

alter table apptflow.plan_prices
  add column if not exists lemon_variant_id text;
