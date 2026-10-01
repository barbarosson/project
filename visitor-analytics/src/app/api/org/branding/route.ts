import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  canManageTeam,
  getSessionFromRequest,
  getUserOrg,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brandDisplayName, brandLogoUrl } from "@/lib/branding";

const patchSchema = z.object({
  brandLogoUrl: z.string().url().max(500).nullable().optional(),
  brandDisplayName: z.string().max(80).nullable().optional(),
  digestEnabled: z.boolean().optional(),
  spikeMultiplier: z.number().min(1.5).max(20).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const org = membership.org;
  return NextResponse.json({
    id: org.id,
    name: org.name,
    brandLogoUrl: org.brandLogoUrl,
    brandDisplayName: org.brandDisplayName,
    displayName: brandDisplayName(org),
    logoUrl: brandLogoUrl(org),
    digestEnabled: org.digestEnabled,
    spikeMultiplier: org.spikeMultiplier,
    canEdit: canManageTeam(membership.role),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = patchSchema.parse(await req.json());
    if (body.brandLogoUrl) {
      const ok = brandLogoUrl({
        name: membership.org.name,
        brandLogoUrl: body.brandLogoUrl,
        brandDisplayName: null,
      });
      if (!ok) {
        return NextResponse.json(
          { error: "brandLogoUrl must be http(s)" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.organization.update({
      where: { id: membership.orgId },
      data: {
        ...(body.brandLogoUrl !== undefined
          ? { brandLogoUrl: body.brandLogoUrl }
          : {}),
        ...(body.brandDisplayName !== undefined
          ? {
              brandDisplayName: body.brandDisplayName?.trim() || null,
            }
          : {}),
        ...(body.digestEnabled !== undefined
          ? { digestEnabled: body.digestEnabled }
          : {}),
        ...(body.spikeMultiplier !== undefined
          ? { spikeMultiplier: body.spikeMultiplier }
          : {}),
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      brandLogoUrl: updated.brandLogoUrl,
      brandDisplayName: updated.brandDisplayName,
      displayName: brandDisplayName(updated),
      logoUrl: brandLogoUrl(updated),
      digestEnabled: updated.digestEnabled,
      spikeMultiplier: updated.spikeMultiplier,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
