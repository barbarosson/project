import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, adminUser) => {
    try {
      const supabase = getAdminClient();
      const authHeader = req.headers.get('authorization')!;
      const token = authHeader.substring(7);

      const authedClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data: profiles, error: profilesError } = await authedClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        return NextResponse.json({ error: profilesError.message }, { status: 500 });
      }

      const tenantIds = Array.from(new Set((profiles || []).map((p: any) => p.tenant_id).filter(Boolean)));

      let usageStats: Record<string, any> = {};

      if (tenantIds.length > 0) {
        const [invoicesRes, customersRes, productsRes, expensesRes] = await Promise.all([
          authedClient.from('invoices').select('tenant_id', { count: 'exact', head: false }).in('tenant_id', tenantIds),
          authedClient.from('customers').select('tenant_id', { count: 'exact', head: false }).in('tenant_id', tenantIds),
          authedClient.from('products').select('tenant_id', { count: 'exact', head: false }).in('tenant_id', tenantIds),
          authedClient.from('expenses').select('tenant_id', { count: 'exact', head: false }).in('tenant_id', tenantIds),
        ]);

        const countByTenant = (data: any[] | null) => {
          const counts: Record<string, number> = {};
          (data || []).forEach(row => {
            counts[row.tenant_id] = (counts[row.tenant_id] || 0) + 1;
          });
          return counts;
        };

        const invoiceCounts = countByTenant(invoicesRes.data);
        const customerCounts = countByTenant(customersRes.data);
        const productCounts = countByTenant(productsRes.data);
        const expenseCounts = countByTenant(expensesRes.data);

        for (const tid of tenantIds) {
          usageStats[tid] = {
            invoices: invoiceCounts[tid] || 0,
            customers: customerCounts[tid] || 0,
            products: productCounts[tid] || 0,
            expenses: expenseCounts[tid] || 0,
          };
        }
      }

      return NextResponse.json({ users: profiles, usageStats });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAdminAuth(request, async (req, adminUser) => {
    try {
      const body = await req.json();
      const { userId, updates } = body;

      if (!userId || !updates) {
        return NextResponse.json(
          { error: 'userId and updates are required' },
          { status: 400 }
        );
      }

      if (adminUser.role !== 'super_admin' && updates.role) {
        return NextResponse.json(
          { error: 'Only super admins can change user roles' },
          { status: 403 }
        );
      }

      const token = req.headers.get('authorization')!.substring(7);
      const authedClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data, error } = await authedClient
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ user: data });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  });
}
