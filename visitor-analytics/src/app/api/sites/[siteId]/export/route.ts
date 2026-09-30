import { NextRequest, NextResponse } from "next/server";
import { assertSiteAccess, getSessionFromRequest } from "@/lib/auth";
import { daysAgo } from "@/lib/conversions";
import { prisma } from "@/lib/prisma";

function csvEscape(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ];
  return lines.join("\n") + "\n";
}

/**
 * GET /api/sites/:siteId/export?type=pageviews|conversions&days=30
 */
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

  const type = req.nextUrl.searchParams.get("type") || "pageviews";
  const days = Math.min(
    90,
    Math.max(1, Number(req.nextUrl.searchParams.get("days") || "30"))
  );
  const since = daysAgo(days);

  let csv: string;
  let filename: string;

  if (type === "conversions") {
    const rows = await prisma.conversion.findMany({
      where: { siteId, createdAt: { gte: since } },
      include: { goal: { select: { name: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });
    csv = toCsv(
      [
        "createdAt",
        "goal",
        "goalType",
        "path",
        "eventName",
        "visitorId",
        "sessionId",
        "utmSource",
        "utmMedium",
        "utmCampaign",
      ],
      rows.map((r) => [
        r.createdAt.toISOString(),
        r.goal.name,
        r.goal.type,
        r.path,
        r.eventName,
        r.visitorId,
        r.sessionId,
        r.utmSource,
        r.utmMedium,
        r.utmCampaign,
      ])
    );
    filename = `sitepulse-conversions-${siteId.slice(0, 8)}-${days}d.csv`;
  } else {
    const rows = await prisma.event.findMany({
      where: { siteId, type: "pageview", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });
    csv = toCsv(
      [
        "createdAt",
        "path",
        "title",
        "referrer",
        "visitorId",
        "sessionId",
        "deviceClass",
        "utmSource",
        "utmMedium",
        "utmCampaign",
      ],
      rows.map((r) => [
        r.createdAt.toISOString(),
        r.path,
        r.title,
        r.referrer,
        r.visitorId,
        r.sessionId,
        r.deviceClass,
        r.utmSource,
        r.utmMedium,
        r.utmCampaign,
      ])
    );
    filename = `sitepulse-pageviews-${siteId.slice(0, 8)}-${days}d.csv`;
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
