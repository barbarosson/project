-- Scale stored credit amounts to tenths (0.1 credit precision) for per-100-char billing.
-- Run once per environment after deploying the matching app version.

UPDATE isendai.entitlements
SET credits_balance = credits_balance * 10
WHERE credits_balance <> 0;

UPDATE isendai.requests
SET credits_charged = credits_charged * 10
WHERE credits_charged <> 0;

UPDATE isendai.entitlements
SET monthly_credit_allowance = monthly_credit_allowance * 10
WHERE monthly_credit_allowance IS NOT NULL AND monthly_credit_allowance <> 0;
