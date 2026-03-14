import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const email = request.nextUrl.searchParams.get('email')?.trim();
    if (!email) {
      return NextResponse.json(
        { error: 'email parametresi gerekli (ornek: ?email=test@domain.com)' },
        { status: 400 }
      );
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Sunucu yapilandirmasi eksik (SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 500 }
      );
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const emailNorm = email.toLowerCase();
    const { data: profile, error } = await service
      .from('profiles')
      .select('id, email, full_name, role')
      .ilike('email', emailNorm)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({
        exists: false,
        message: 'Bu e-posta adresi hicbir kullaniciya tanimli degil.',
      });
    }

    return NextResponse.json({
      exists: true,
      userId: profile.id,
      email: profile.email,
      full_name: profile.full_name ?? null,
      role: profile.role ?? null,
      message: `Bu e-posta adresi baska bir kullaniciya tanimli (${profile.full_name || profile.id}).`,
    });
  });
}
