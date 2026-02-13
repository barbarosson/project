export type SupplierStatus = 'active' | 'blacklisted' | 'suspended' | 'inactive';
export type PurchaseOrderStatus = 'draft' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
export type RequisitionPriority = 'low' | 'medium' | 'high' | 'critical';
export type RequisitionStatus = 'pending' | 'approved' | 'ordered' | 'rejected';

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  tax_id?: string;
  category: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  reliability_rating: number;
  status: SupplierStatus;
  payment_terms?: string;
  notes?: string;
  total_orders_count: number;
  total_spent: number;
  average_delivery_days?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  po_number: string;
  supplier_id: string;
  branch_id?: string;
  project_id?: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_terms?: string;
  notes?: string;
  received_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  tenant_id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  line_total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    stock_quantity: number;
  };
}

export interface PurchaseRequisition {
  id: string;
  tenant_id: string;
  product_id: string;
  current_stock: number;
  min_stock_level: number;
  suggested_quantity: number;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  reason?: string;
  converted_to_po_id?: string;
  created_at: string;
  created_by_system: boolean;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

export interface SupplierPriceHistory {
  id: string;
  tenant_id: string;
  supplier_id: string;
  product_id: string;
  unit_price: number;
  currency: string;
  order_date: string;
  purchase_order_id?: string;
  created_at: string;
}

export interface ProcurementStats {
  activeOrders: number;
  pendingApprovals: number;
  upcomingDeliveries: number;
  totalSpent: number;
  averageOrderValue: number;
  topSuppliers: Array<{
    supplier_id: string;
    supplier_name: string;
    total_spent: number;
    order_count: number;
  }>;
}

export interface AIInsight {
  type: 'price_risk' | 'lead_time_warning' | 'stock_out' | 'supplier_performance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action?: string;
  related_id?: string;
}

export interface PriceWatchdogAlert {
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name: string;
  last_price: number;
  current_price: number;
  price_increase_percent: number;
  order_date: string;
}
