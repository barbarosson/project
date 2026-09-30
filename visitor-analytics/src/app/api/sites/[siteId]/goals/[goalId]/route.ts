import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSiteAccess, getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  matchValue: z.string().min(1).max(512).optional(),
  matchMode: z.enum(["exact", "prefix"]).optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; goalId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { siteId, goalId } = await params;
  const site = await assertSiteAccess(session.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.conversionGoal.findFirst({
    where: { id: goalId, siteId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.conversionGoal.delete({ where: { id: goalId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; goalId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { siteId, goalId } = await params;
  const site = await assertSiteAccess(session.id, siteId);
  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.conversionGoal.findFirst({
    where: { id: goalId, siteId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = patchSchema.parse(await req.json());
    const goal = await prisma.conversionGoal.update({
      where: { id: goalId },
      data: body,
    });
    return NextResponse.json({ goal });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
