import { NextRequest, NextResponse } from "next/server";
import { assertSiteAccess, getSessionFromRequest } from "@/lib/auth";
import { computeFunnelDropoff, daysAgo } from "@/lib/conversions";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; funnelId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { siteId, funnelId } = await params;
  const site = await assertSiteAccess(session.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, siteId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!funnel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const daysParam = Number(req.nextUrl.searchParams.get("days") || "30");
  const days = daysParam === 7 ? 7 : 30;
  const since = daysAgo(days);

  const events = await prisma.event.findMany({
    where: { siteId, createdAt: { gte: since } },
    select: {
      type: true,
      path: true,
      eventName: true,
      sessionId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const stats = computeFunnelDropoff(funnel.steps, events);
  const steps = funnel.steps.map((step, i) => ({
    id: step.id,
    name: step.name,
    order: step.order,
    type: step.type,
    matchValue: step.matchValue,
    matchMode: step.matchMode,
    sessions: stats[i]?.sessions ?? 0,
    dropoffRate: stats[i]?.dropoffRate ?? null,
    conversionFromStart:
      stats[0]?.sessions && stats[0].sessions > 0
        ? (stats[i]?.sessions ?? 0) / stats[0].sessions
        : null,
  }));

  return NextResponse.json({
    funnel: { id: funnel.id, name: funnel.name },
    days,
    steps,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; funnelId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { siteId, funnelId } = await params;
  const site = await assertSiteAccess(session.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.funnel.findFirst({
    where: { id: funnelId, siteId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.funnel.delete({ where: { id: funnelId } });
  return NextResponse.json({ ok: true });
}
