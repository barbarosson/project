import { NextResponse } from "next/server";

/** Yer tutucu: Gmail / Calendar OAuth ve işlemleri Google Cloud Console’da yapılandırılır. */
export async function GET() {
  return NextResponse.json({
    gmail: { enabled: false, note: "Google Cloud OAuth + Gmail API scope gerekli." },
    calendar: { enabled: false, note: "Google Calendar API + etkinlik yazma gerekli." },
    payments: { enabled: false, note: "Stripe / Duffel sonraki faz." },
  });
}
