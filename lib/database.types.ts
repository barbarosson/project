export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          sku: string
          category: string
          unit: string
          purchase_price: number
          sale_price: number
          average_cost: number
          description: string | null
          status: string
          current_stock: number
          critical_level: number
          stock_status: string
          total_sold: number
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku: string
          category: string
          unit: string
          purchase_price?: number
          sale_price: number
          average_cost?: number
          description?: string | null
          status?: string
          current_stock?: number
          critical_level?: number
          stock_status?: string
          total_sold?: number
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string
          category?: string
          unit?: string
          purchase_price?: number
          sale_price?: number
          average_cost?: number
          description?: string | null
          status?: string
          current_stock?: number
          critical_level?: number
          stock_status?: string
          total_sold?: number
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          status: string | null
          total_revenue: number | null
          created_at: string | null
          updated_at: string | null
          account_type: string | null
          tax_office: string | null
          tax_number: string | null
          balance: number | null
          e_invoice_enabled: boolean | null
          company_title: string | null
          tenant_id: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          status?: string | null
          total_revenue?: number | null
          created_at?: string | null
          updated_at?: string | null
          account_type?: string | null
          tax_office?: string | null
          tax_number?: string | null
          balance?: number | null
          e_invoice_enabled?: boolean | null
          company_title?: string | null
          tenant_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          status?: string | null
          total_revenue?: number | null
          created_at?: string | null
          updated_at?: string | null
          account_type?: string | null
          tax_office?: string | null
          tax_number?: string | null
          balance?: number | null
          e_invoice_enabled?: boolean | null
          company_title?: string | null
          tenant_id?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          customer_id: string
          issue_date: string
          due_date: string
          subtotal: number
          tax_amount: number
          total_amount: number
          status: string
          notes: string | null
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          customer_id: string
          issue_date: string
          due_date: string
          subtotal: number
          tax_amount: number
          total_amount: number
          status?: string
          notes?: string | null
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          customer_id?: string
          issue_date?: string
          due_date?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          status?: string
          notes?: string | null
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          product_id: string
          description: string
          quantity: number
          unit_price: number
          tax_rate: number
          total: number
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          product_id: string
          description: string
          quantity: number
          unit_price: number
          tax_rate?: number
          total: number
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          product_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          tax_rate?: number
          total?: number
          tenant_id?: string
          created_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          stock_quantity: number
          min_stock_level: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          stock_quantity?: number
          min_stock_level?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          stock_quantity?: number
          min_stock_level?: number
          tenant_id?: string
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          movement_type: string
          quantity: number
          unit_cost: number
          reason: string | null
          reference_type: string
          reference_id: string | null
          notes: string | null
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          movement_type: string
          quantity: number
          unit_cost?: number
          reason?: string | null
          reference_type: string
          reference_id?: string | null
          notes?: string | null
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          movement_type?: string
          quantity?: number
          unit_cost?: number
          reason?: string | null
          reference_type?: string
          reference_id?: string | null
          notes?: string | null
          tenant_id?: string
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          name: string
          type: string
          status: string
          start_date: string
          end_date: string | null
          budget: number
          spent: number
          target_audience: string | null
          description: string | null
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          status?: string
          start_date: string
          end_date?: string | null
          budget?: number
          spent?: number
          target_audience?: string | null
          description?: string | null
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          status?: string
          start_date?: string
          end_date?: string | null
          budget?: number
          spent?: number
          target_audience?: string | null
          description?: string | null
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          description: string
          amount: number
          category: string
          expense_date: string
          payment_method: string | null
          reference_number: string | null
          notes: string | null
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          category: string
          expense_date: string
          payment_method?: string | null
          reference_number?: string | null
          notes?: string | null
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          category?: string
          expense_date?: string
          payment_method?: string | null
          reference_number?: string | null
          notes?: string | null
          tenant_id?: string
          created_at?: string
        }
      }
      purchase_invoices: {
        Row: {
          id: string
          supplier_name: string
          invoice_number: string
          invoice_date: string
          due_date: string
          subtotal: number
          tax_amount: number
          total_amount: number
          status: string
          notes: string | null
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_name: string
          invoice_number: string
          invoice_date: string
          due_date: string
          subtotal: number
          tax_amount: number
          total_amount: number
          status?: string
          notes?: string | null
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_name?: string
          invoice_number?: string
          invoice_date?: string
          due_date?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          status?: string
          notes?: string | null
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      company_settings: {
        Row: {
          id: string
          company_name: string
          tax_office: string | null
          tax_number: string | null
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          currency: string
          language: string
          date_format: string
          timezone: string
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          tax_office?: string | null
          tax_number?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          currency?: string
          language?: string
          date_format?: string
          timezone?: string
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          tax_office?: string | null
          tax_number?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          currency?: string
          language?: string
          date_format?: string
          timezone?: string
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          priority: string
          status: string
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          priority?: string
          status?: string
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          priority?: string
          status?: string
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
