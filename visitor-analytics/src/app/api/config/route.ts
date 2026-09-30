import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public site config for the tracking snippet.
 * GET /api/config?k=<publicKey>
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("k");
  if (!key) {
    return NextResponse.json({ error: "Missing site key" }, { status: 400 });
  }

  const site = await prisma.site.findUnique({
    where: { publicKey: key },
    select: {
      identityMode: true,
      requireConsent: true,
      domain: true,
      publicKey: true,
    },
  });

  if (!site) {
    return NextResponse.json({ error: "Unknown site key" }, { status: 404 });
  }

  const res = NextResponse.json({
    identityMode: site.identityMode,
    requireConsent: site.requireConsent,
    domain: site.domain,
  });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
