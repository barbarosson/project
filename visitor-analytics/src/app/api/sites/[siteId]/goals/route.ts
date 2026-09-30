import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSiteAccess, getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["url", "event"]),
  matchValue: z.string().min(1).max(512),
  matchMode: z.enum(["exact", "prefix"]).default("exact"),
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

  const goals = await prisma.conversionGoal.findMany({
    where: { siteId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ goals });
}

export async function POST(
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

  try {
    const body = createSchema.parse(await req.json());
    const matchMode = body.type === "event" ? "exact" : body.matchMode;
    const goal = await prisma.conversionGoal.create({
      data: {
        siteId,
        name: body.name,
        type: body.type,
        matchValue: body.matchValue.trim(),
        matchMode,
      },
    });
    return NextResponse.json({ goal }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
