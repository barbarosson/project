/*
  # Fix Function Search Path Security - Comprehensive

  ## Summary
  Fixes all "function_search_path_mutable" security warnings by setting explicit search paths
  for all custom functions in the database. This prevents potential search path attacks.

  ## Security Changes
  Sets `search_path = public` for all custom functions:
  
  ### Support & Chat Functions
  - `update_support_chat_session_updated_at()` - Updates chat session timestamps
  - `update_session_on_new_message()` - Updates session on new message
  - `update_thread_timestamp()` - Updates AI chat thread timestamps
  
  ### Campaign Functions
  - `generate_campaign_code()` - Generates unique campaign codes
  - `set_campaign_code()` - Sets campaign code on insert
  - `update_campaigns_timestamp()` - Updates campaign timestamps
  
  ### Invoice & Payment Functions
  - `update_invoice_payment_amounts()` - Auto-updates invoice payment amounts
  - `update_invoice_paid_status()` - Auto-sets invoice to 'paid' when fully paid
  - `update_overdue_invoices()` - Auto-updates overdue invoice statuses
  - `sync_stock_on_invoice_change()` - Syncs stock when invoice changes
  
  ### Finance Functions
  - `initialize_account_balance()` - Initializes account balances
  - `update_account_balance()` - Updates account balances on transactions
  
  ### Inventory Functions
  - `calculate_product_average_cost(uuid)` - Calculates product average cost
  
  ### Support Ticket Functions
  - `generate_ticket_number()` - Generates ticket numbers
  - `set_ticket_number()` - Sets ticket number on insert
  
  ### Validation Functions
  - `validate_transaction_references()` - Validates transaction references

  ## Impact
  - ✅ Eliminates all function_search_path_mutable warnings
  - ✅ Prevents search path injection attacks
  - ✅ No functional changes - only security hardening
  - ✅ All functions remain fully operational
*/

-- Support & Chat Functions
ALTER FUNCTION public.update_support_chat_session_updated_at() SET search_path = public;
ALTER FUNCTION public.update_session_on_new_message() SET search_path = public;
ALTER FUNCTION public.update_thread_timestamp() SET search_path = public;

-- Campaign Functions
ALTER FUNCTION public.generate_campaign_code() SET search_path = public;
ALTER FUNCTION public.set_campaign_code() SET search_path = public;
ALTER FUNCTION public.update_campaigns_timestamp() SET search_path = public;

-- Invoice & Payment Functions
ALTER FUNCTION public.update_invoice_payment_amounts() SET search_path = public;
ALTER FUNCTION public.update_invoice_paid_status() SET search_path = public;
ALTER FUNCTION public.update_overdue_invoices() SET search_path = public;
ALTER FUNCTION public.sync_stock_on_invoice_change() SET search_path = public;

-- Finance Functions
ALTER FUNCTION public.initialize_account_balance() SET search_path = public;
ALTER FUNCTION public.update_account_balance() SET search_path = public;

-- Inventory Functions
ALTER FUNCTION public.calculate_product_average_cost(uuid) SET search_path = public;

-- Support Ticket Functions
ALTER FUNCTION public.generate_ticket_number() SET search_path = public;
ALTER FUNCTION public.set_ticket_number() SET search_path = public;

-- Validation Functions
ALTER FUNCTION public.validate_transaction_references() SET search_path = public;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✓ All function search paths secured';
  RAISE NOTICE '✓ 16 functions hardened against search path attacks';
END $$;