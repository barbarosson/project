import { NextRequest, NextResponse } from "next/server";
import { assertSiteAccess, getSessionFromRequest } from "@/lib/auth";
import { dateKey, daysAgo } from "@/lib/conversions";
import { prisma } from "@/lib/prisma";

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

  const daysParam = Number(req.nextUrl.searchParams.get("days") || "30");
  const days = daysParam === 7 ? 7 : 30;
  const since = daysAgo(days);

  const [conversions, goals] = await Promise.all([
    prisma.conversion.findMany({
      where: { siteId, createdAt: { gte: since } },
      include: { goal: { select: { id: true, name: true, type: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversionGoal.findMany({ where: { siteId } }),
  ]);

  const byDayMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    byDayMap.set(dateKey(daysAgo(i)), 0);
  }
  for (const c of conversions) {
    const k = dateKey(c.createdAt);
    if (byDayMap.has(k)) byDayMap.set(k, (byDayMap.get(k) || 0) + 1);
  }
  const trend = [...byDayMap.entries()].map(([date, count]) => ({
    date,
    count,
  }));

  const byGoal = goals.map((g) => ({
    goalId: g.id,
    name: g.name,
    type: g.type,
    count: conversions.filter((c) => c.goalId === g.id).length,
  }));

  const utmMap = new Map<string, number>();
  for (const c of conversions) {
    const key = c.utmSource
      ? `${c.utmSource}${c.utmMedium ? ` / ${c.utmMedium}` : ""}${c.utmCampaign ? ` / ${c.utmCampaign}` : ""}`
      : "(none)";
    utmMap.set(key, (utmMap.get(key) || 0) + 1);
  }
  const utmBreakdown = [...utmMap.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return NextResponse.json({
    days,
    total: conversions.length,
    trend,
    byGoal,
    utmBreakdown,
    recent: conversions.slice(0, 20).map((c) => ({
      id: c.id,
      goalName: c.goal.name,
      goalType: c.goal.type,
      path: c.path,
      eventName: c.eventName,
      utmSource: c.utmSource,
      utmMedium: c.utmMedium,
      utmCampaign: c.utmCampaign,
      createdAt: c.createdAt,
    })),
  });
}
