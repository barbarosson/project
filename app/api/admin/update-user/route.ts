import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST: Kullanici guncelleme (profil, abonelik, auth email) - sadece super_admin.
 * Edit-user-dialog ile ayni body; Edge Function yerine bu API kullanilir (401 cozum).
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (_req, adminUser) => {
    if (adminUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Sunucu yapilandirmasi eksik' }, { status: 500 });
    }

    const body = await request.json();
    const {
      userId,
      email,
      full_name,
      phone,
      company_name,
      role,
      plan_name,
      plan_status,
      plan_expires_at,
      payment_method,
      auto_renew,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId zorunludur' }, { status: 400 });
    }

    const validRoles = ['user', 'super_admin'];
    const newRole = role && validRoles.includes(role) ? role : undefined;

    const service = getServiceClient();
    const emailNorm = email !== undefined && email !== null && String(email).trim()
      ? String(email).toLowerCase().trim()
      : undefined;

    let emailUpdateError: string | null = null;

    if (emailNorm) {
      const { data: existing } = await service
        .from('profiles')
        .select('id')
        .ilike('email', emailNorm)
        .neq('id', userId)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi baska bir kullanici tarafindan kullaniliyor. Farkli bir e-posta secin.' },
          { status: 400 }
        );
      }
      const { error: emailError } = await service.auth.admin.updateUserById(userId, {
        email: emailNorm,
        email_confirm: true,
      });
      if (emailError) {
        const msg = (emailError.message || '').trim();
        if (/already|duplicate|zaten|kayitli|registered/i.test(msg)) {
          emailUpdateError = 'Bu e-posta adresi zaten kullaniliyor; diger alanlar guncellendi.';
        } else if (/error updating user|failed to update|guncellenemedi/i.test(msg) || !msg) {
          emailUpdateError = 'E-posta degisikligi uygulanamadi (sistem kisiti). Diger bilgiler guncellendi.';
        } else {
          emailUpdateError = msg ? `E-posta: ${msg} Diger alanlar guncellendi.` : 'E-posta guncellenemedi; diger alanlar guncellendi.';
        }
      } else {
        emailUpdateError = null;
      }
    }

    const profileUpdates: Record<string, unknown> = {};
    if (emailNorm !== undefined && !emailUpdateError) profileUpdates.email = emailNorm;
    if (full_name !== undefined) profileUpdates.full_name = full_name || null;
    if (phone !== undefined) profileUpdates.phone = phone || null;
    if (company_name !== undefined) profileUpdates.company_name = company_name || null;
    if (newRole) profileUpdates.role = newRole;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await service
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);
      if (profileError) {
        return NextResponse.json(
          { error: 'Profil guncellenemedi: ' + profileError.message },
          { status: 500 }
        );
      }
    }

    if (company_name !== undefined) {
      const { data: profile } = await service
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.tenant_id) {
        await service
          .from('company_settings')
          .update({ company_name: company_name || '' })
          .eq('tenant_id', profile.tenant_id);
        await service
          .from('tenants')
          .update({ name: company_name || '' })
          .eq('id', profile.tenant_id);
      }
    }

    const validPlans = ['FREE', 'KUCUK', 'ORTA', 'BUYUK', 'ENTERPRISE'];
    const validStatuses = ['active', 'cancelled', 'expired'];
    const subUpdates: Record<string, unknown> = {};

    if (newRole === 'super_admin') {
      const { error: upsertErr } = await service
        .from('user_subscriptions')
        .upsert(
          {
            user_id: userId,
            plan_name: 'ENTERPRISE',
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: null,
            payment_method: null,
            auto_renew: true,
          },
          { onConflict: 'user_id' }
        );
      if (upsertErr) {
        return NextResponse.json(
          { error: 'Abonelik atanmadi: ' + upsertErr.message },
          { status: 500 }
        );
      }
    } else {
      if (plan_name && validPlans.includes(plan_name)) subUpdates.plan_name = plan_name;
      if (plan_status && validStatuses.includes(plan_status)) subUpdates.status = plan_status;
      if (plan_expires_at !== undefined) subUpdates.expires_at = plan_expires_at || null;
      if (payment_method !== undefined) subUpdates.payment_method = payment_method || null;
      if (auto_renew !== undefined) subUpdates.auto_renew = auto_renew;

      if (Object.keys(subUpdates).length > 0) {
        const { error: subError } = await service
          .from('user_subscriptions')
          .update(subUpdates)
          .eq('user_id', userId);
        if (subError) {
          return NextResponse.json(
            { error: 'Abonelik guncellenemedi: ' + subError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      ...(emailUpdateError ? { warning: emailUpdateError } : {}),
    });
  });
}
