import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://modulustech.app';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SPECIAL = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~";

/** Supabase sifre politikasina uygun gecici sifre: en az bir kucuk harf, bir buyuk harf, bir rakam, bir ozel karakter. */
function generateTempCode(): string {
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const pool = LOWER + UPPER + DIGITS + SPECIAL;
  const part = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SPECIAL)];
  for (let i = 0; i < 6; i++) part.push(pool[Math.floor(Math.random() * pool.length)]);
  return part.sort(() => Math.random() - 0.5).join('');
}

/**
 * POST: Admin sifre sifirlama – Supabase politikasina uygun gecici sifre uretir, auth gunceller, must_change_password isaretler, opsiyonel e-posta gonderir.
 */
export async function POST(request: NextRequest) {
  try {
    const res = await withAdminAuth(request, async (_req, adminUser) => {
      if (adminUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
      }
      if (!SUPABASE_URL?.trim()) {
        return NextResponse.json(
          { error: 'NEXT_PUBLIC_SUPABASE_URL eksik' },
          { status: 500 }
        );
      }
      if (!SUPABASE_SERVICE_ROLE_KEY?.trim()) {
        return NextResponse.json(
          { error: 'SUPABASE_SERVICE_ROLE_KEY eksik; .env.local icinde tanimlayin' },
          { status: 500 }
        );
      }

      const body = await request.json().catch(() => ({}));
      const userId = body?.userId;

      if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ error: 'userId zorunludur (string)' }, { status: 400 });
      }

      const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: targetUser, error: userError } =
        await service.auth.admin.getUserById(userId);
      if (userError || !targetUser?.user) {
        return NextResponse.json(
          { error: 'Kullanici bulunamadi: ' + (userError?.message ?? '') },
          { status: 404 }
        );
      }

      const targetEmail = targetUser.user.email ?? '';
      const tempCode = generateTempCode();

      const { error: updateError } = await service.auth.admin.updateUserById(userId, {
        password: tempCode,
      });

      if (updateError) {
        return NextResponse.json(
          { error: 'Sifre guncellenemedi: ' + updateError.message },
          { status: 500 }
        );
      }

      const { error: profileError } = await service
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', userId);
      if (profileError) {
        console.warn('[reset-password] profiles update:', profileError.message);
      }

      if (RESEND_API_KEY && targetEmail) {
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
    <h2 style="color: #0A2540; margin-top: 0;">Sifreniz Sifirlandi</h2>
    <p>Hesabiniz icin gecici bir giris sifresi olusturuldu. Ilk giriste uygulama sizden yeni bir sifre belirlemenizi isteyecektir.</p>
    <p style="font-size: 18px; font-weight: 600; letter-spacing: 4px; background: #e2e8f0; padding: 12px 20px; border-radius: 8px; text-align: center;">${tempCode}</p>
    <p style="color: #64748b; font-size: 14px;">Bu kodu kimseyle paylasmayin. Giris yaptiktan sonra mutlaka sifrenizi degistirin.</p>
    <p style="margin-top: 24px;"><a href="${SITE_URL}/dashboard" style="background: #00D4AA; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Uygulamaya Gir</a></p>
    <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">ModulusTech ERP - Otomatik e-posta</p>
  </div>
</body>
</html>`;
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'ModulusTech <noreply@modulus.app>',
              to: [targetEmail],
              subject: 'ModulusTech - Gecici giris kodu (sifre sifirlandi)',
              html,
            }),
          });
          if (!emailRes.ok) {
            const errText = await emailRes.text();
            console.error('Resend error:', errText);
          }
        } catch (e) {
          console.error('Send email error:', e);
        }
      }

      return NextResponse.json({
        success: true,
        message:
          'Sifre sifirlandi. Gecici kod kullaniciya e-posta ile gonderildi (e-posta yapilandirmasi yoksa atlandi).',
      });
    });
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[admin/reset-password]', err);
    return NextResponse.json(
      { error: 'Sifre sifirlama hatasi: ' + msg },
      { status: 500 }
    );
  }
}
