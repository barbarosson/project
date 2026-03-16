import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'ModulusTech <info@modulusaas.com>';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SPECIAL = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~";

function generateTempCode(): string {
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const pool = LOWER + UPPER + DIGITS + SPECIAL;
  const part = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SPECIAL)];
  for (let i = 0; i < 6; i++) part.push(pool[Math.floor(Math.random() * pool.length)]);
  return part.sort(() => Math.random() - 0.5).join('');
}

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 *
 * Kullanici tarafindan girilen e-posta icin, eger sistemde kayitliysa:
 * - Gecici sifre uretir
 * - auth.admin.updateUserById ile sifreyi gunceller
 * - profiles.must_change_password = true yapar
 * - Sifre sifirlama e-postasi gonderir
 *
 * Guvenlik icin: her zaman 200 doner, var/yok ayrimini acik etmez.
 */
export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL?.trim() || !SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      return NextResponse.json(
        { error: 'Sunucu konfigürasyonu eksik (Supabase anahtarlari tanimli degil).' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawEmail = body?.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        { error: 'E-posta adresi zorunludur.' },
        { status: 400 }
      );
    }

    const emailNorm = rawEmail.trim().toLowerCase();
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // E-postaya gore profil bul (id lazim)
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('id, email')
      .ilike('email', emailNorm)
      .maybeSingle();

    if (profileError) {
      console.error('[forgot-password] profile error:', profileError.message);
      // Guvenlik icin yine de 200 donuyoruz
      return NextResponse.json({
        success: true,
        message:
          'Eger bu e-posta sistemimizde kayitliyse, sifre sifirlama e-postasi gonderildi.',
      });
    }

    if (!profile) {
      // Kullanici yok: yine de ayni mesaji don (user enumeration engelleme)
      return NextResponse.json({
        success: true,
        message:
          'Eger bu e-posta sistemimizde kayitliyse, sifre sifirlama e-postasi gonderildi.',
      });
    }

    const userId = profile.id as string;
    const tempCode = generateTempCode();

    const { error: updateError } = await service.auth.admin.updateUserById(userId, {
      password: tempCode,
    });

    if (updateError) {
      console.error('[forgot-password] update error:', updateError.message);
      return NextResponse.json({
        success: true,
        message:
          'Eger bu e-posta sistemimizde kayitliyse, sifre sifirlama e-postasi gonderildi.',
      });
    }

    const { error: mustChangeError } = await service
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId);
    if (mustChangeError) {
      console.warn('[forgot-password] must_change_password update:', mustChangeError.message);
    }

    // E-posta gonder
    if (RESEND_API_KEY && profile.email) {
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
      Aşağıdaki bağlantıyı kullanarak ModulusSaaS’e gidebilir ve hesabınıza giriş yapabilirsiniz:
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
            to: [profile.email],
            subject: 'ModulusSaaS - Şifre sıfırlama bilgileri',
            html,
          }),
        });

        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error('[forgot-password] Resend error:', errText);
        }
      } catch (e) {
        console.error('[forgot-password] Send email error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        'Eger bu e-posta sistemimizde kayitliyse, sifre sifirlama e-postasi gonderildi.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[forgot-password] error:', err);
    return NextResponse.json(
      {
        success: true,
        message:
          'Eger bu e-posta sistemimizde kayitliyse, sifre sifirlama e-postasi gonderildi.',
      },
      { status: 200 }
    );
  }
}

