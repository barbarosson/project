import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80).optional(),
});

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { org: { select: { name: true } } },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Invite invalid or expired" },
      { status: 404 }
    );
  }

  const siteIds = JSON.parse(invite.siteIds || "[]") as string[];
  const sites = await prisma.site.findMany({
    where: { id: { in: siteIds }, orgId: invite.orgId },
    select: { id: true, name: true, domain: true },
  });

  return NextResponse.json({
    email: invite.email,
    orgName: invite.org.name,
    sites,
    expiresAt: invite.expiresAt,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const invite = await prisma.invite.findUnique({
      where: { token: body.token },
    });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invite invalid or expired" },
        { status: 404 }
      );
    }

    const email = invite.email.toLowerCase();
    const siteIds = JSON.parse(invite.siteIds || "[]") as string[];
    const passwordHash = await hashPassword(body.password);

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Existing user joining as client — verify password matches or update if they set new
      // For simplicity: if user exists, just attach membership (password already set)
      const existingMembership = await prisma.membership.findUnique({
        where: { userId_orgId: { userId: user.id, orgId: invite.orgId } },
      });
      if (existingMembership) {
        return NextResponse.json(
          { error: "Already a member" },
          { status: 409 }
        );
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: body.name ?? email.split("@")[0],
        },
      });
    }

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        orgId: invite.orgId,
        role: "client",
        siteAccess: {
          create: siteIds.map((siteId) => ({ siteId })),
        },
      },
    });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    const res = NextResponse.json({
      ok: true,
      membershipId: membership.id,
      user: { id: user.id, email: user.email, name: user.name },
    });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Accept failed" }, { status: 500 });
  }
}
