import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSiteAccess, getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  domain: z.string().min(1).max(255).optional(),
  identityMode: z.enum(["first_party_cookie", "cookieless"]).optional(),
  ipTruncate: z.boolean().optional(),
  retentionDays: z.number().int().min(1).max(730).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { siteId } = await params;
  const site = await assertSiteAccess(session.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [rollups, recentEvents, topPages, totals] = await Promise.all([
    prisma.dailyRollup.findMany({
      where: { siteId, date: { gte: since.toISOString().slice(0, 10) } },
      orderBy: { date: "asc" },
    }),
    prisma.event.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        path: true,
        title: true,
        referrer: true,
        visitorId: true,
        sessionId: true,
        deviceClass: true,
        createdAt: true,
      },
    }),
    prisma.event.groupBy({
      by: ["path"],
      where: { siteId, createdAt: { gte: since } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.event.aggregate({
      where: { siteId, createdAt: { gte: since } },
      _count: true,
    }),
  ]);

  const sessionCount = await prisma.event.findMany({
    where: { siteId, createdAt: { gte: since } },
    distinct: ["sessionId"],
    select: { sessionId: true },
  });

  const visitorCount = await prisma.event.findMany({
    where: { siteId, createdAt: { gte: since } },
    distinct: ["visitorId"],
    select: { visitorId: true },
  });

  return NextResponse.json({
    site,
    stats: {
      pageviews30d: totals._count,
      sessions30d: sessionCount.length,
      uniques30d: visitorCount.length,
    },
    rollups,
    recentEvents,
    topPages: topPages.map((p) => ({
      path: p.path,
      views: p._count.path,
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { siteId } = await params;
  const existing = await assertSiteAccess(session.id, siteId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = patchSchema.parse(await req.json());
    const site = await prisma.site.update({
      where: { id: siteId },
      data: {
        ...body,
        domain: body.domain
          ? body.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
          : undefined,
      },
    });
    return NextResponse.json({ site });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
