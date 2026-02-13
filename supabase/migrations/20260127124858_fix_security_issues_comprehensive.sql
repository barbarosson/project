/*
  # Comprehensive Security and Performance Fix

  ## Overview
  This migration addresses critical security issues and performance improvements identified in the database audit.

  ## Changes

  ### 1. Add Missing Foreign Key Indexes
  - Add index on `expenses.account_id` for foreign key performance
  - Add index on `support_messages.sender_id` for foreign key performance

  ### 2. Remove Unused Indexes
  Removes indexes that are not being used to reduce overhead:
  - idx_transactions_customer_id
  - idx_invoice_line_items_inventory_id
  - idx_invoice_line_items_product_id
  - idx_proposal_line_items_product_id
  - idx_proposals_customer_id
  - idx_purchase_invoice_line_items_product_id
  - idx_purchase_invoice_line_items_purchase_invoice_id
  - idx_purchase_invoices_supplier_id
  - idx_transactions_account_id
  - idx_support_chat_sessions_user_id
  - idx_support_chat_sessions_is_read_by_admin
  - idx_support_chat_sessions_updated_at
  - idx_support_messages_tenant_id
  - idx_support_messages_created_at
  - idx_support_messages_is_read

  ### 3. Fix Multiple Permissive Policies
  Removes duplicate/overlapping RLS policies that could cause security issues:
  - ai_chat_history: Remove public dev tenant policies
  - ai_chat_threads: Remove public dev tenant policies
  - support_chat_sessions: Remove overly permissive policies
  - support_messages: Remove overly permissive policies

  ### 4. Fix Always-True RLS Policies
  Replaces policies that bypass security with proper tenant-based policies:
  - support_chat_sessions: Add proper tenant filtering
  - support_messages: Add proper tenant filtering and ownership checks

  ## Security Impact
  - Improved query performance with proper indexes
  - Eliminated RLS policy conflicts
  - Enforced proper tenant isolation
  - Closed security holes from always-true policies
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Index for expenses.account_id foreign key
CREATE INDEX IF NOT EXISTS idx_expenses_account_id 
ON expenses(account_id);

-- Index for support_messages.sender_id foreign key
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id 
ON support_messages(sender_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_transactions_customer_id;
DROP INDEX IF EXISTS idx_invoice_line_items_inventory_id;
DROP INDEX IF EXISTS idx_invoice_line_items_product_id;
DROP INDEX IF EXISTS idx_proposal_line_items_product_id;
DROP INDEX IF EXISTS idx_proposals_customer_id;
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_product_id;
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_purchase_invoice_id;
DROP INDEX IF EXISTS idx_purchase_invoices_supplier_id;
DROP INDEX IF EXISTS idx_transactions_account_id;
DROP INDEX IF EXISTS idx_support_chat_sessions_user_id;
DROP INDEX IF EXISTS idx_support_chat_sessions_is_read_by_admin;
DROP INDEX IF EXISTS idx_support_chat_sessions_updated_at;
DROP INDEX IF EXISTS idx_support_messages_tenant_id;
DROP INDEX IF EXISTS idx_support_messages_created_at;
DROP INDEX IF EXISTS idx_support_messages_is_read;

-- ============================================================================
-- 3. FIX MULTIPLE PERMISSIVE POLICIES - AI CHAT TABLES
-- ============================================================================

-- Remove public dev tenant policies for ai_chat_history
DROP POLICY IF EXISTS "Public dev tenant full access to history" ON ai_chat_history;

-- Remove public dev tenant policies for ai_chat_threads
DROP POLICY IF EXISTS "Public dev tenant full access to threads" ON ai_chat_threads;

-- ============================================================================
-- 4. FIX MULTIPLE PERMISSIVE POLICIES - SUPPORT TABLES
-- ============================================================================

-- Remove public dev tenant policies
DROP POLICY IF EXISTS "Public access to dev tenant chat sessions" ON support_chat_sessions;
DROP POLICY IF EXISTS "Public access to dev tenant messages" ON support_messages;

-- Remove the always-true policies that bypass security
DROP POLICY IF EXISTS "Authenticated users can manage chat sessions" ON support_chat_sessions;
DROP POLICY IF EXISTS "Authenticated users can manage messages" ON support_messages;

-- ============================================================================
-- 5. CREATE PROPER RLS POLICIES FOR SUPPORT_CHAT_SESSIONS
-- ============================================================================

-- Users can view their own chat sessions (by user_id)
CREATE POLICY "Users can view own chat sessions"
  ON support_chat_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create chat sessions for their own account
CREATE POLICY "Users can create own chat sessions"
  ON support_chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own chat sessions
CREATE POLICY "Users can update own chat sessions"
  ON support_chat_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions"
  ON support_chat_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 6. CREATE PROPER RLS POLICIES FOR SUPPORT_MESSAGES
-- ============================================================================

-- Users can view messages in sessions they own
CREATE POLICY "Users can view own session messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.user_id = auth.uid()
    )
  );

-- Users can create messages in sessions they own
CREATE POLICY "Users can create messages in own sessions"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.user_id = auth.uid()
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON support_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON support_messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- ============================================================================
-- 7. KEEP ADMIN POLICIES (These are restrictive and properly scoped)
-- ============================================================================

-- Note: The following admin policies remain in place:
-- - "Admins can view all chat sessions"
-- - "Admins can update all chat sessions"
-- - "Admins can create messages in any session"
-- - "Admins can view all messages"
-- - "Admins can update all messages"
-- These are fine because they check for admin role explicitly.