import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { getSessionFromRequest, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 20);

const createSchema = z.object({
  name: z.string().min(1).max(120),
  domain: z.string().min(1).max(255),
  identityMode: z
    .enum(["first_party_cookie", "cookieless"])
    .default("first_party_cookie"),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getUserOrg(session.id);
  if (!membership) {
    return NextResponse.json({ sites: [] });
  }

  const sites = await prisma.site.findMany({
    where: { orgId: membership.orgId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      domain: true,
      publicKey: true,
      identityMode: true,
      ipTruncate: true,
      retentionDays: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    org: { id: membership.org.id, name: membership.org.name },
    sites,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getUserOrg(session.id);
  if (!membership) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  try {
    const body = createSchema.parse(await req.json());
    const publicKey = `sp_${nanoid()}`;
    const site = await prisma.site.create({
      data: {
        name: body.name,
        domain: body.domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        publicKey,
        identityMode: body.identityMode,
        orgId: membership.orgId,
      },
    });
    return NextResponse.json({ site }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
