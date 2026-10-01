import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { brandDisplayName, brandLogoUrl } from "@/lib/branding";
import { daysAgo } from "@/lib/conversions";

const unlockSchema = z.object({
  password: z.string().min(1).max(128),
});

async function loadActiveLink(token: string) {
  const link = await prisma.sharedLink.findUnique({
    where: { token },
    include: {
      org: true,
      site: true,
    },
  });
  if (!link || link.revokedAt) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;
  return link;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const link = await loadActiveLink(token);
  if (!link) {
    return NextResponse.json({ error: "Link invalid or revoked" }, { status: 404 });
  }

  return NextResponse.json({
    scope: link.scope,
    label: link.label,
    requiresPassword: Boolean(link.passwordHash),
    brand: {
      displayName: brandDisplayName(link.org),
      logoUrl: brandLogoUrl(link.org),
    },
    site:
      link.scope === "site" && link.site
        ? { name: link.site.name, domain: link.site.domain }
        : null,
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const link = await loadActiveLink(token);
  if (!link) {
    return NextResponse.json({ error: "Link invalid or revoked" }, { status: 404 });
  }

  try {
    if (link.passwordHash) {
      const body = unlockSchema.parse(await req.json().catch(() => ({})));
      const ok = await bcrypt.compare(body.password, link.passwordHash);
      if (!ok) {
        return NextResponse.json({ error: "Wrong password" }, { status: 401 });
      }
    }

    const since = daysAgo(7);
    const brand = {
      displayName: brandDisplayName(link.org),
      logoUrl: brandLogoUrl(link.org),
    };

    if (link.scope === "site" && link.site) {
      const siteId = link.site.id;
      const [pageviews, conversions, topPages, rollups] = await Promise.all([
        prisma.event.count({
          where: { siteId, type: "pageview", createdAt: { gte: since } },
        }),
        prisma.conversion.count({
          where: { siteId, createdAt: { gte: since } },
        }),
        prisma.event.groupBy({
          by: ["path"],
          where: { siteId, type: "pageview", createdAt: { gte: since } },
          _count: { path: true },
          orderBy: { _count: { path: "desc" } },
          take: 8,
        }),
        prisma.dailyRollup.findMany({
          where: {
            siteId,
            date: { gte: since.toISOString().slice(0, 10) },
          },
          orderBy: { date: "asc" },
        }),
      ]);

      return NextResponse.json({
        scope: "site",
        brand,
        site: { name: link.site.name, domain: link.site.domain },
        summary: {
          range: "7d",
          pageviews,
          conversions,
          topPages: topPages.map((p) => ({
            path: p.path,
            count: p._count.path,
          })),
          rollups: rollups.map((r) => ({
            date: r.date,
            pageviews: r.pageviews,
            sessions: r.sessions,
          })),
        },
        privacyNote:
          "Read-only shared summary. No visitor IPs, emails, or company enrichment.",
      });
    }

    // org portfolio
    const sites = await prisma.site.findMany({
      where: { orgId: link.orgId },
      orderBy: { createdAt: "asc" },
    });
    const cards = await Promise.all(
      sites.map(async (site) => {
        const [pv, conv] = await Promise.all([
          prisma.event.count({
            where: {
              siteId: site.id,
              type: "pageview",
              createdAt: { gte: since },
            },
          }),
          prisma.conversion.count({
            where: { siteId: site.id, createdAt: { gte: since } },
          }),
        ]);
        return {
          name: site.name,
          domain: site.domain,
          pageviews: pv,
          conversions: conv,
        };
      })
    );

    return NextResponse.json({
      scope: "org",
      brand,
      summary: {
        range: "7d",
        sites: cards,
        totalPageviews: cards.reduce((a, c) => a + c.pageviews, 0),
        totalConversions: cards.reduce((a, c) => a + c.conversions, 0),
      },
      privacyNote:
        "Read-only portfolio summary for this agency. No PII export.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
