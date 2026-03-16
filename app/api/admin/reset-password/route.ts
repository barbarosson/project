import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ModulusTech <info@modulusaas.com>';
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

      let emailSent = false;
      let emailError: string | null = null;

      if (RESEND_API_KEY && targetEmail) {
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px; background: #0f172a0d;">
  <div style="background: #ffffff; border-radius: 16px; padding: 24px 24px 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15,23,42,0.08);">
    <div style="border-radius: 999px; padding: 4px 12px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; background: #ecfeff; color: #0891b2; margin-bottom: 12px;">
      <span style="width: 6px; height: 6px; border-radius: 999px; background: #22c55e;"></span>
      MODULUSAAS · GÜVENLİK BİLDİRİMİ
    </div>
    <h2 style="color: #0f172a; margin: 4px 0 8px; font-size: 22px;">Şifreniz sıfırlandı</h2>
    <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">
      ModulusSaaS hesabınız için geçici bir giriş şifresi oluşturduk. Bu şifreyi kullanarak giriş yaptıktan sonra
      sizden <strong>yeni ve kalıcı bir şifre belirlemeniz</strong> istenecek.
    </p>
    <div style="margin: 18px 0 16px;">
      <div style="font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
        Geçici giriş şifreniz
      </div>
      <p style="font-size: 22px; font-weight: 700; letter-spacing: 6px; background: #0f172a; color: #e5f2ff; padding: 14px 20px; border-radius: 12px; text-align: center; border: 1px solid #1e293b;">
        ${tempCode}
      </p>
      <p style="margin: 6px 0 0; font-size: 11px; color: #64748b; text-align: center;">
        Bu şifre sadece bir kez kullanım içindir ve girişten sonra sizden yeni şifre belirlemeniz istenecektir.
      </p>
    </div>
    <p style="margin: 4px 0 14px; font-size: 13px; color: #64748b;">
      Güvenliğiniz için bu şifreyi <strong>kimseyle paylaşmayın</strong>. ModulusSaaS ekibi sizden
      asla şifrenizi veya bu kodu istemez.
    </p>
    <p style="margin: 0 0 18px; font-size: 13px; color: #64748b;">
      Aşağıdaki butona tıklayarak ModulusSaaS’e gidebilir ve hesabınıza giriş yapabilirsiniz:
    </p>
    <p style="margin: 0 0 18px;">
      <a href="https://modulusaas.com" style="display: inline-block; background: linear-gradient(135deg,#0f766e,#22c55e); color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 999px; font-weight: 600; font-size: 14px; box-shadow: 0 8px 20px rgba(16,185,129,0.35);">
        ModulusSaaS'e Git
      </a>
    </p>
    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
      Eğer bu işlem sizin tarafınızdan yapılmadıysa, lütfen hemen şifrenizi değiştirin ve
      <a href="mailto:info@modulusaas.com" style="color:#0ea5e9; text-decoration:none;">info@modulusaas.com</a>
      adresinden bizimle iletişime geçin.
    </p>
    <p style="margin: 10px 0 0; font-size: 11px; color: #cbd5f5;">
      Bu e-posta ModulusSaaS tarafından otomatik olarak gönderilmiştir.
    </p>
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
              from: RESEND_FROM_EMAIL,
              to: [targetEmail],
              subject: 'ModulusTech - Gecici giris sifresi (sifre sifirlandi)',
              html,
            }),
          });
          const errText = await emailRes.text();
          if (emailRes.ok) {
            emailSent = true;
          } else {
            let msg = errText;
            try {
              const errJson = JSON.parse(errText) as { message?: string };
              msg = errJson.message || errText;
            } catch {
              // keep errText
            }
            emailError = msg;
            console.error('[reset-password] Resend error:', emailRes.status, msg);
          }
        } catch (e) {
          emailError = e instanceof Error ? e.message : String(e);
          console.error('[reset-password] Send email error:', e);
        }
      } else if (targetEmail) {
        emailError = 'RESEND_API_KEY tanimli degil; e-posta gonderilmedi.';
      }

      return NextResponse.json({
        success: true,
        message: emailSent
          ? 'Sifre sifirlandi. Gecici sifre kullaniciya e-posta ile gonderildi.'
          : emailError
            ? `Sifre sifirlandi ancak e-posta gonderilemedi: ${emailError}`
            : 'Sifre sifirlandi. (E-posta atlandi.)',
        emailSent,
        emailError: emailError ?? undefined,
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
