import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Service role client: bypasses RLS so admin can see all users and correct usage stats. */
function getServiceClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin users list');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server config missing (SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 500 }
      );
    }

    try {
      const service = getServiceClient();

      const { data: profiles, error: profilesError } = await service
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        return NextResponse.json({ error: profilesError.message }, { status: 500 });
      }

      const tenantIds = Array.from(
        new Set((profiles || []).map((p: any) => p.tenant_id).filter(Boolean))
      ) as string[];

      let usageStats: Record<string, { invoices: number; customers: number; products: number; expenses: number }> = {};

      if (tenantIds.length > 0) {
        const [invoicesRes, customersRes, productsRes, expensesRes] = await Promise.all([
          service.from('invoices').select('tenant_id').in('tenant_id', tenantIds),
          service.from('customers').select('tenant_id').in('tenant_id', tenantIds),
          service.from('products').select('tenant_id').in('tenant_id', tenantIds),
          service.from('expenses').select('tenant_id').in('tenant_id', tenantIds),
        ]);

        const countByTenant = (data: { tenant_id: string }[] | null) => {
          const counts: Record<string, number> = {};
          (data || []).forEach(row => {
            if (row.tenant_id) counts[row.tenant_id] = (counts[row.tenant_id] || 0) + 1;
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

      const userIds = (profiles || []).map((p: any) => p.id);
      const membershipByUser: Record<string, string | null> = {};
      if (userIds.length > 0) {
        const { data: subs, error: subsError } = await service
          .from('user_subscriptions')
          .select('user_id, plan_name, status')
          .in('user_id', userIds);
        if (!subsError && subs) {
          for (const sub of subs as any[]) {
            if (sub.status === 'active' && !membershipByUser[sub.user_id]) {
              membershipByUser[sub.user_id] = sub.plan_name;
            }
          }
        }
      }

      const lastSignInByUser: Record<string, string | null> = {};
      let page = 1;
      const perPage = 1000;
      while (true) {
        const { data: authData, error: authError } = await service.auth.admin.listUsers({
          page,
          per_page: perPage,
        });
        if (authError) break;
        const users = authData?.users ?? [];
        for (const u of users) {
          lastSignInByUser[u.id] = u.last_sign_in_at ?? null;
        }
        if (users.length < perPage) break;
        page++;
      }

      const usersWithMembership = (profiles || []).map((p: any) => ({
        ...p,
        last_sign_in_at: lastSignInByUser[p.id] ?? p.last_sign_in_at ?? null,
        membership_plan: membershipByUser[p.id] ?? null,
      }));

      return NextResponse.json({ users: usersWithMembership, usageStats });
    } catch (error) {
      console.error('Admin users GET error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch users' },
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
