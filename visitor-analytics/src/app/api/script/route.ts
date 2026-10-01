import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * First-party script proxy pattern.
 * Customers can rewrite their domain `/sp.js` → `{APP}/api/script`
 * (or `/t.js`) so the tracker loads from their origin and avoids some blockers.
 */
export async function GET(req: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), "public", "t.js");
    const body = await readFile(filePath, "utf8");
    const res = new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
        "X-SitePulse-Proxy": "1",
      },
    });
    // Allow customers to discover ingest host via optional query
    const host = req.nextUrl.searchParams.get("host");
    if (host) {
      res.headers.set("X-SitePulse-Ingest-Host", host);
    }
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Script unavailable" },
      { status: 500 }
    );
  }
}
