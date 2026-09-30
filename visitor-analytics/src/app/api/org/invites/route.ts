import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import {
  canManageTeam,
  getSessionFromRequest,
  getUserOrg,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 32);

const createSchema = z.object({
  email: z.string().email(),
  siteIds: z.array(z.string().min(1)).min(1),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [invites, members] = await Promise.all([
    prisma.invite.findMany({
      where: { orgId: membership.orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membership.findMany({
      where: { orgId: membership.orgId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        siteAccess: { select: { siteId: true } },
      },
      orderBy: { role: "asc" },
    }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      email: m.user.email,
      name: m.user.name,
      siteIds: m.siteAccess.map((a) => a.siteId),
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      siteIds: JSON.parse(i.siteIds || "[]") as string[],
      expiresAt: i.expiresAt,
      acceptedAt: i.acceptedAt,
      createdAt: i.createdAt,
      acceptUrl: i.acceptedAt
        ? null
        : `${appUrl}/invite/${i.token}`,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    // Validate sites belong to org
    const sites = await prisma.site.findMany({
      where: { orgId: membership.orgId, id: { in: body.siteIds } },
      select: { id: true },
    });
    if (sites.length !== body.siteIds.length) {
      return NextResponse.json(
        { error: "One or more sites are invalid" },
        { status: 400 }
      );
    }

    const existingMember = await prisma.membership.findFirst({
      where: {
        orgId: membership.orgId,
        user: { email },
      },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 409 }
      );
    }

    const token = nanoid();
    const invite = await prisma.invite.create({
      data: {
        email,
        token,
        role: "client",
        siteIds: JSON.stringify(body.siteIds),
        invitedBy: session.id,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        orgId: membership.orgId,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json(
      {
        invite: {
          id: invite.id,
          email: invite.email,
          siteIds: body.siteIds,
          expiresAt: invite.expiresAt,
          acceptUrl: `${appUrl}/invite/${invite.token}`,
          // Min-budget: no email provider — return link for owner to share
          delivery: "link_only",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Invite failed" }, { status: 500 });
  }
}
