/*
  # Remove Duplicate Indexes

  This migration removes duplicate indexes that cover the same columns.
  Keeping both wastes storage and slows down write operations.

  ## Changes
  - Remove duplicate indexes, keeping only one per column set
*/

-- Payroll - keep idx_payroll_tenant_id, drop idx_payroll_tenant
DROP INDEX IF EXISTS public.idx_payroll_tenant;

-- Payroll Items - keep newer versions
DROP INDEX IF EXISTS public.idx_payroll_items_payroll;
DROP INDEX IF EXISTS public.idx_payroll_items_staff;

-- Plan Feature Assignments - keep idx_plan_feature_assignments_feature_id
DROP INDEX IF EXISTS public.idx_pfa_feature_id;

-- Purchase Invoice Line Items - keep the most descriptive ones
DROP INDEX IF EXISTS public.idx_purchase_invoice_items_product;
DROP INDEX IF EXISTS public.idx_purchase_invoice_items_invoice;

-- Purchase Invoices - keep the newer ones
DROP INDEX IF EXISTS public.idx_purchase_invoices_supplier;
DROP INDEX IF EXISTS public.idx_purchase_invoices_tenant;

-- Salary Definitions - keep idx_salary_definitions_tenant_id
DROP INDEX IF EXISTS public.idx_salary_definitions_tenant;

-- Staff - keep idx_staff_tenant_id
DROP INDEX IF EXISTS public.idx_staff_tenant;

-- Supplier Price History - keep the newer ones
DROP INDEX IF EXISTS public.idx_price_history_product;
DROP INDEX IF EXISTS public.idx_price_history_supplier;
DROP INDEX IF EXISTS public.idx_price_history_tenant;

-- Tenants - keep idx_tenants_owner_id
DROP INDEX IF EXISTS public.idx_tenants_owner;