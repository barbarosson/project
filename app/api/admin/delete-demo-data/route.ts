import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (_req, _adminUser) => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      const missing = [!SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL', !SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean).join(', ');
      return NextResponse.json(
        {
          error: 'Sunucu yapilandirmasi eksik (Supabase)',
          detail: `Eksik ortam degiskeni: ${missing}. .env.local dosyasina ekleyin.`,
        },
        { status: 500 }
      );
    }

    let body: { tenant_id?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'tenant_id gerekli' }, { status: 400 });
    }

    const tenant_id = body.tenant_id;
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id gerekli' }, { status: 400 });
    }

    try {
      const serviceKey = SUPABASE_SERVICE_ROLE_KEY.trim();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/seed-demo-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
          Apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ tenant_id: String(tenant_id).trim(), delete_only: true }),
      });

      const raw = await res.text();
      if (!res.ok) {
        console.error('[delete-demo-data] Edge function error:', res.status, raw);
      }
      return new NextResponse(raw, {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: unknown) {
      console.error('Delete demo data proxy error:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Demo veri silme istegi basarisiz' },
        { status: 500 }
      );
    }
  });
}
