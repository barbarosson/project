import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSiteAccess,
  assertSiteWriteAccess,
  getSessionFromRequest,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stepSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["url", "event"]),
  matchValue: z.string().min(1).max(512),
  matchMode: z.enum(["exact", "prefix"]).default("exact"),
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  steps: z.array(stepSchema).min(2).max(5),
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

  const funnels = await prisma.funnel.findMany({
    where: { siteId },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ funnels });
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
  const site = await assertSiteWriteAccess(session.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await req.json());
    const funnel = await prisma.funnel.create({
      data: {
        siteId,
        name: body.name,
        steps: {
          create: body.steps.map((s, i) => ({
            name: s.name,
            order: i,
            type: s.type,
            matchValue: s.matchValue.trim(),
            matchMode: s.type === "event" ? "exact" : s.matchMode,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json({ funnel }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input (2–5 steps required)" },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
