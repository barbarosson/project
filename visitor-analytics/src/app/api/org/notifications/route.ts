import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, getUserOrg } from "@/lib/auth";
import {
  listOrgNotifications,
  markNotificationsRead,
} from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Clients see notifications? Keep staff-only for quota/digest/spike.
  if (membership.role === "client") {
    return NextResponse.json({ notifications: [] });
  }

  const notifications = await listOrgNotifications(membership.orgId);
  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      meta: JSON.parse(n.meta || "{}"),
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership || membership.role === "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? (body.ids as string[]) : undefined;
  await markNotificationsRead(membership.orgId, ids);
  return NextResponse.json({ ok: true });
}
