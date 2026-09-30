import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { matchesEvent, matchesUrl } from "@/lib/conversions";
import { consumePageviewQuota } from "@/lib/quota";
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
  type: z.enum(["pageview", "event"]).default("pageview"),
  path: z.string().min(1).max(2048),
  eventName: z.string().min(1).max(120).optional().nullable(),
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

    if (body.type === "event" && !body.eventName?.trim()) {
      return cors(
        NextResponse.json(
          { error: "eventName required for type=event" },
          { status: 400 }
        )
      );
    }

    const site = await prisma.site.findUnique({
      where: { publicKey: body.k },
      include: { conversionGoals: true },
    });
    if (!site) {
      return cors(
        NextResponse.json({ error: "Invalid site key" }, { status: 401 })
      );
    }

    // Hard quota on pageviews (events still allowed for conversion debugging)
    if (body.type === "pageview") {
      const quota = await consumePageviewQuota(site.orgId);
      if (!quota.allowed) {
        return cors(
          NextResponse.json(
            {
              error: "Pageview quota exceeded",
              code: "quota_exceeded",
              snapshot: "snapshot" in quota ? quota.snapshot : undefined,
            },
            { status: 429 }
          )
        );
      }
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

    // Preserve query in path for display if provided as full path+search
    const rawPath = body.path.startsWith("/") ? body.path : `/${body.path}`;
    const storedPath = rawPath.slice(0, 2048);
    const eventName =
      body.type === "event" ? body.eventName!.trim().slice(0, 120) : null;

    const event = await prisma.event.create({
      data: {
        type: body.type,
        path: storedPath,
        eventName,
        title: body.title?.slice(0, 512) ?? null,
        referrer: body.referrer?.slice(0, 2048) ?? null,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        visitorId: visitorId!,
        sessionId: sessionId!,
        deviceClass: deviceClass(ua),
        country: null,
        ipTruncated,
        userAgent: ua?.slice(0, 512) ?? null,
        siteId: site.id,
      },
    });

    if (body.type === "pageview") {
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
    }

    // Match conversion goals (once per session per goal)
    const convertedGoalIds: string[] = [];
    for (const goal of site.conversionGoals) {
      let hit = false;
      if (goal.type === "url" && body.type === "pageview") {
        hit = matchesUrl(storedPath, goal.matchValue, goal.matchMode);
      } else if (goal.type === "event" && body.type === "event") {
        hit = matchesEvent(eventName, goal.matchValue);
      }
      if (!hit) continue;

      try {
        await prisma.conversion.create({
          data: {
            goalId: goal.id,
            siteId: site.id,
            visitorId: visitorId!,
            sessionId: sessionId!,
            path: storedPath,
            eventName,
            utmSource: utm.utmSource,
            utmMedium: utm.utmMedium,
            utmCampaign: utm.utmCampaign,
          },
        });
        convertedGoalIds.push(goal.id);
      } catch {
        // Unique (goalId, sessionId) — already converted this session
      }
    }

    return cors(
      NextResponse.json({
        ok: true,
        eventId: event.id,
        conversions: convertedGoalIds.length,
      })
    );
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
