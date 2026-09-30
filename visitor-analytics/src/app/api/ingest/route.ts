import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clientIp,
  cookielessVisitorId,
  deviceClass,
  parseUtm,
  truncateIp,
  ymd,
} from "@/lib/tracking";

const schema = z.object({
  k: z.string().min(8).max(64),
  type: z.enum(["pageview"]).default("pageview"),
  path: z.string().min(1).max(2048),
  title: z.string().max(512).optional().nullable(),
  referrer: z.string().max(2048).optional().nullable(),
  url: z.string().max(4096).optional().nullable(),
  visitorId: z.string().max(64).optional().nullable(),
  sessionId: z.string().max(64).optional().nullable(),
});

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = schema.parse(json);

    const site = await prisma.site.findUnique({
      where: { publicKey: body.k },
    });
    if (!site) {
      return cors(
        NextResponse.json({ error: "Invalid site key" }, { status: 401 })
      );
    }

    const ua = req.headers.get("user-agent");
    const rawIp = clientIp(req.headers);
    const ipTruncated = site.ipTruncate ? truncateIp(rawIp) : rawIp;
    const day = ymd();
    const utm = parseUtm(body.url ?? undefined);

    let visitorId = body.visitorId?.trim() || null;
    let sessionId = body.sessionId?.trim() || null;

    if (site.identityMode === "cookieless") {
      visitorId = cookielessVisitorId({
        ipTruncated,
        userAgent: ua,
        day,
        siteId: site.id,
      });
      // Ephemeral tab session from client is OK; else derive short session
      sessionId =
        sessionId ||
        cookielessVisitorId({
          ipTruncated,
          userAgent: ua,
          day: `${day}:${Math.floor(Date.now() / (30 * 60 * 1000))}`,
          siteId: site.id,
        });
    } else {
      if (!visitorId || !sessionId) {
        return cors(
          NextResponse.json(
            { error: "visitorId and sessionId required for cookie mode" },
            { status: 400 }
          )
        );
      }
    }

    const path = body.path.startsWith("/") ? body.path : `/${body.path}`;

    await prisma.event.create({
      data: {
        type: body.type,
        path: path.slice(0, 2048),
        title: body.title?.slice(0, 512) ?? null,
        referrer: body.referrer?.slice(0, 2048) ?? null,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        visitorId: visitorId!,
        sessionId: sessionId!,
        deviceClass: deviceClass(ua),
        country: null, // geo deferred; privacy-honest placeholder
        ipTruncated,
        userAgent: ua?.slice(0, 512) ?? null,
        siteId: site.id,
      },
    });

    // Upsert daily rollup (best-effort; unique count approximate via +1)
    await prisma.dailyRollup.upsert({
      where: {
        siteId_date: { siteId: site.id, date: day },
      },
      create: {
        siteId: site.id,
        date: day,
        pageviews: 1,
        sessions: 1,
        uniques: 1,
      },
      update: {
        pageviews: { increment: 1 },
      },
    });

    return cors(NextResponse.json({ ok: true }));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return cors(
        NextResponse.json(
          { error: "Invalid payload", details: err.flatten() },
          { status: 400 }
        )
      );
    }
    console.error(err);
    return cors(
      NextResponse.json({ error: "Ingest failed" }, { status: 500 })
    );
  }
}
