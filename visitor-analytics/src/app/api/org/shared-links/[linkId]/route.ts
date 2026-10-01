import { NextRequest, NextResponse } from "next/server";
import {
  canManageTeam,
  getSessionFromRequest,
  getUserOrg,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ linkId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { linkId } = await ctx.params;
  const link = await prisma.sharedLink.findFirst({
    where: { id: linkId, orgId: membership.orgId },
  });
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.sharedLink.update({
    where: { id: link.id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
