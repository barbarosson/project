import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth } from '@/lib/admin-auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  return withSuperAdminAuth(request, async (_req, _adminUser) => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      const missing = [
        !SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
        !SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
      ]
        .filter(Boolean)
        .join(', ');
      return NextResponse.json(
        {
          error: 'Sunucu yapilandirmasi eksik (Supabase)',
          detail: `Eksik ortam degiskeni: ${missing}. .env.local dosyasina ekleyin.`,
        },
        { status: 500 }
      );
    }

    type Body = {
      requestId?: string;
      email?: string;
      fullName?: string;
      companyName?: string;
    };

    let body: Body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Gecersiz istek govdesi' }, { status: 400 });
    }

    const { requestId, email, fullName, companyName } = body || {};
    if (!requestId || !email || !fullName || !companyName) {
      return NextResponse.json(
        { error: 'Eksik alanlar: requestId, email, fullName, companyName' },
        { status: 400 }
      );
    }

    try {
      const serviceKey = SUPABASE_SERVICE_ROLE_KEY.trim();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-demo-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
          Apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ requestId, email, fullName, companyName }),
      });

      const raw = await res.text();
      return new NextResponse(raw, {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: unknown) {
      console.error('Create demo account proxy error:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Demo hesap olusturma basarisiz' },
        { status: 500 }
      );
    }
  });
}

