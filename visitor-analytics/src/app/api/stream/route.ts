import { NextRequest, NextResponse } from "next/server";
import {
  getAccessibleSiteIds,
  getSessionFromRequest,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Near-realtime visitor stream (poll every 5–15s).
 * GET /api/stream?siteId=&since=&limit=
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getAccessibleSiteIds(session.id);
  if (!access) {
    return NextResponse.json({ items: [], sessions: [] });
  }

  const siteIdParam = req.nextUrl.searchParams.get("siteId");
  const sinceParam = req.nextUrl.searchParams.get("since");
  const limit = Math.min(
    100,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "40"))
  );

  let siteFilter: string[];
  if (siteIdParam) {
    if (access.siteIds !== "all" && !access.siteIds.includes(siteIdParam)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const owned = await prisma.site.findFirst({
      where: { id: siteIdParam, orgId: access.membership.orgId },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    siteFilter = [siteIdParam];
  } else if (access.siteIds === "all") {
    const sites = await prisma.site.findMany({
      where: { orgId: access.membership.orgId },
      select: { id: true },
    });
    siteFilter = sites.map((s) => s.id);
  } else {
    siteFilter = access.siteIds;
  }

  if (siteFilter.length === 0) {
    return NextResponse.json({
      items: [],
      sessions: [],
      polledAt: new Date().toISOString(),
    });
  }

  const since = sinceParam
    ? new Date(sinceParam)
    : new Date(Date.now() - 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      siteId: { in: siteFilter },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      site: { select: { id: true, name: true, domain: true } },
    },
  });

  // Group into recent sessions (last activity first)
  const sessionMap = new Map<
    string,
    {
      sessionId: string;
      visitorId: string;
      siteId: string;
      siteName: string;
      lastPath: string;
      lastType: string;
      eventName: string | null;
      deviceClass: string | null;
      pageviews: number;
      lastSeenAt: Date;
      startedAt: Date;
    }
  >();

  for (const ev of events) {
    const key = `${ev.siteId}:${ev.sessionId}`;
    const existing = sessionMap.get(key);
    if (!existing) {
      sessionMap.set(key, {
        sessionId: ev.sessionId,
        visitorId: ev.visitorId,
        siteId: ev.siteId,
        siteName: ev.site.name,
        lastPath: ev.path,
        lastType: ev.type,
        eventName: ev.eventName,
        deviceClass: ev.deviceClass,
        pageviews: ev.type === "pageview" ? 1 : 0,
        lastSeenAt: ev.createdAt,
        startedAt: ev.createdAt,
      });
    } else {
      existing.pageviews += ev.type === "pageview" ? 1 : 0;
      if (ev.createdAt < existing.startedAt) existing.startedAt = ev.createdAt;
      if (ev.createdAt > existing.lastSeenAt) {
        existing.lastSeenAt = ev.createdAt;
        existing.lastPath = ev.path;
        existing.lastType = ev.type;
        existing.eventName = ev.eventName;
        existing.deviceClass = ev.deviceClass;
      }
    }
  }

  const sessions = [...sessionMap.values()].sort(
    (a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime()
  );

  return NextResponse.json({
    polledAt: new Date().toISOString(),
    items: events.map((ev) => ({
      id: ev.id,
      type: ev.type,
      path: ev.path,
      eventName: ev.eventName,
      visitorId: ev.visitorId,
      sessionId: ev.sessionId,
      deviceClass: ev.deviceClass,
      utmSource: ev.utmSource,
      siteId: ev.siteId,
      siteName: ev.site.name,
      createdAt: ev.createdAt,
    })),
    sessions,
  });
}
