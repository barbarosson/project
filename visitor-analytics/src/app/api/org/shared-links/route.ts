import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import {
  canManageTeam,
  getSessionFromRequest,
  getUserOrg,
  hashPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 32);

const createSchema = z.object({
  scope: z.enum(["site", "org"]),
  siteId: z.string().min(1).optional(),
  label: z.string().max(80).optional(),
  password: z.string().min(4).max(128).optional().nullable(),
  expiresInDays: z.number().int().min(1).max(365).optional().nullable(),
});

function shareUrl(token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/share/${token}`;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const siteId = req.nextUrl.searchParams.get("siteId");
  const links = await prisma.sharedLink.findMany({
    where: {
      orgId: membership.orgId,
      revokedAt: null,
      ...(siteId ? { siteId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { site: { select: { id: true, name: true, domain: true } } },
  });

  return NextResponse.json({
    links: links.map((l) => ({
      id: l.id,
      scope: l.scope,
      label: l.label,
      siteId: l.siteId,
      site: l.site,
      hasPassword: Boolean(l.passwordHash),
      expiresAt: l.expiresAt,
      createdAt: l.createdAt,
      url: shareUrl(l.token),
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
    if (body.scope === "site") {
      if (!body.siteId) {
        return NextResponse.json(
          { error: "siteId required for site scope" },
          { status: 400 }
        );
      }
      const site = await prisma.site.findFirst({
        where: { id: body.siteId, orgId: membership.orgId },
      });
      if (!site) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }
    }

    const token = nanoid();
    const passwordHash =
      body.password && body.password.length > 0
        ? await hashPassword(body.password)
        : null;
    const expiresAt =
      body.expiresInDays != null
        ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    const link = await prisma.sharedLink.create({
      data: {
        token,
        scope: body.scope,
        label: body.label?.trim() || null,
        passwordHash,
        expiresAt,
        createdBy: session.id,
        orgId: membership.orgId,
        siteId: body.scope === "site" ? body.siteId! : null,
      },
      include: { site: { select: { id: true, name: true, domain: true } } },
    });

    return NextResponse.json(
      {
        link: {
          id: link.id,
          scope: link.scope,
          label: link.label,
          siteId: link.siteId,
          site: link.site,
          hasPassword: Boolean(link.passwordHash),
          expiresAt: link.expiresAt,
          createdAt: link.createdAt,
          url: shareUrl(link.token),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
