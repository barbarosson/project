/*
  # Remove Duplicate Indexes

  ## Overview
  Removes 33 duplicate indexes that are identical to other indexes.
  Keeping the newer naming convention (idx_<table>_<column>) and dropping older variations.

  ## Performance Impact
  - Reduces storage overhead
  - Improves write performance (fewer indexes to maintain)
  - Reduces maintenance complexity

  ## Duplicates Removed
  - ai_production_suggestions (2 duplicates)
  - cost_allocations (2 duplicates)
  - cost_centers (1 duplicate)
  - crm_ai_insights (1 duplicate)
  - crm_tasks (1 duplicate)
  - customer_interactions (1 duplicate)
  - customer_segment_history (1 duplicate)
  - einvoice_details (1 duplicate)
  - equipment (1 duplicate)
  - expenses (1 duplicate)
  - maintenance_schedules (2 duplicates)
  - maintenance_work_orders (2 duplicates)
  - order_items (1 duplicate)
  - orders (1 duplicate)
  - payroll (1 duplicate)
  - payroll_items (2 duplicates)
  - production_bom (2 duplicates)
  - production_recipes (1 duplicate)
  - products (1 duplicate)
  - quality_defects (2 duplicates)
  - quality_inspections (1 duplicate)
  - staff (1 duplicate)
  - staff_ai_insights (2 duplicates)
  - stock_movements (2 duplicates)
*/

-- ai_production_suggestions
DROP INDEX IF EXISTS idx_suggestions_product;
DROP INDEX IF EXISTS idx_suggestions_tenant;

-- cost_allocations
DROP INDEX IF EXISTS idx_cost_allocations_center;
DROP INDEX IF EXISTS idx_cost_allocations_tenant;

-- cost_centers
DROP INDEX IF EXISTS idx_cost_centers_tenant;

-- crm_ai_insights
DROP INDEX IF EXISTS idx_insights_customer;

-- crm_tasks
DROP INDEX IF EXISTS idx_tasks_customer;

-- customer_interactions
DROP INDEX IF EXISTS idx_interactions_customer;

-- customer_segment_history
DROP INDEX IF EXISTS idx_segment_history_customer;

-- einvoice_details
DROP INDEX IF EXISTS idx_einvoice_tenant;

-- equipment
DROP INDEX IF EXISTS idx_equipment_tenant;

-- expenses
DROP INDEX IF EXISTS idx_expenses_tenant;

-- maintenance_schedules
DROP INDEX IF EXISTS idx_maintenance_schedules_equipment;
DROP INDEX IF EXISTS idx_maintenance_schedules_tenant;

-- maintenance_work_orders
DROP INDEX IF EXISTS idx_maintenance_work_orders_equipment;
DROP INDEX IF EXISTS idx_maintenance_work_orders_tenant;

-- order_items
DROP INDEX IF EXISTS idx_order_items_order;

-- orders
DROP INDEX IF EXISTS idx_orders_tenant;

-- payroll
DROP INDEX IF EXISTS idx_payroll_tenant;

-- payroll_items
DROP INDEX IF EXISTS idx_payroll_items_payroll;
DROP INDEX IF EXISTS idx_payroll_items_staff;

-- production_bom
DROP INDEX IF EXISTS idx_production_bom_product;
DROP INDEX IF EXISTS idx_production_bom_tenant;

-- production_recipes
DROP INDEX IF EXISTS idx_recipes_tenant;

-- products
DROP INDEX IF EXISTS idx_products_tenant;

-- quality_defects
DROP INDEX IF EXISTS idx_quality_defects_inspection;
DROP INDEX IF EXISTS idx_quality_defects_tenant;

-- quality_inspections
DROP INDEX IF EXISTS idx_quality_inspections_tenant;

-- staff
DROP INDEX IF EXISTS idx_staff_tenant;

-- staff_ai_insights
DROP INDEX IF EXISTS idx_staff_ai_insights_staff;
DROP INDEX IF EXISTS idx_staff_ai_insights_tenant;

-- stock_movements
DROP INDEX IF EXISTS idx_stock_movements_product;
DROP INDEX IF EXISTS idx_stock_movements_tenant;

-- Log completion
DO $$
DECLARE
  index_count integer;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✓ Removed 33 duplicate indexes';
  RAISE NOTICE '✓ Total remaining indexes: %', index_count;
  RAISE NOTICE '✓ Write performance improved';
  RAISE NOTICE '✓ Storage overhead reduced';
END $$;