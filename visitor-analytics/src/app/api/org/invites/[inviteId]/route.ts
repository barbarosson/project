import { NextRequest, NextResponse } from "next/server";
import {
  canManageTeam,
  getSessionFromRequest,
  getUserOrg,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { inviteId } = await params;
  const invite = await prisma.invite.findFirst({
    where: { id: inviteId, orgId: membership.orgId },
  });
  if (!invite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.invite.delete({ where: { id: inviteId } });
  return NextResponse.json({ ok: true });
}
