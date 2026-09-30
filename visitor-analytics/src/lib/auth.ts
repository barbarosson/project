import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "sp_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

export type OrgRole = "owner" | "admin" | "analyst" | "client";

const WRITE_ROLES: OrgRole[] = ["owner", "admin", "analyst"];
const MANAGE_ROLES: OrgRole[] = ["owner", "admin"];

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

export async function readSessionToken(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(COOKIE)?.value);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromRequest(req: NextRequest) {
  return readSessionToken(req.cookies.get(COOKIE)?.value);
}

/** Org membership for the current user (first org / membership). */
export async function getUserOrg(userId: string) {
  return prisma.membership.findFirst({
    where: { userId },
    include: {
      org: true,
      siteAccess: true,
    },
    orderBy: { org: { createdAt: "asc" } },
  });
}

export function canWrite(role: string): boolean {
  return WRITE_ROLES.includes(role as OrgRole);
}

export function canManageTeam(role: string): boolean {
  return MANAGE_ROLES.includes(role as OrgRole);
}

/** Sites the user may access (all org sites for staff; SiteAccess for clients). */
export async function getAccessibleSiteIds(userId: string): Promise<{
  membership: NonNullable<Awaited<ReturnType<typeof getUserOrg>>>;
  siteIds: string[] | "all";
} | null> {
  const membership = await getUserOrg(userId);
  if (!membership) return null;

  if (membership.role === "client") {
    return {
      membership,
      siteIds: membership.siteAccess.map((a) => a.siteId),
    };
  }
  return { membership, siteIds: "all" };
}

export async function listAccessibleSites(userId: string) {
  const access = await getAccessibleSiteIds(userId);
  if (!access) return { membership: null, sites: [] as Awaited<ReturnType<typeof prisma.site.findMany>> };

  const sites = await prisma.site.findMany({
    where:
      access.siteIds === "all"
        ? { orgId: access.membership.orgId }
        : { orgId: access.membership.orgId, id: { in: access.siteIds } },
    orderBy: { createdAt: "asc" },
  });
  return { membership: access.membership, sites };
}

export async function assertSiteAccess(userId: string, siteId: string) {
  const access = await getAccessibleSiteIds(userId);
  if (!access) return null;

  if (access.siteIds !== "all" && !access.siteIds.includes(siteId)) {
    return null;
  }

  const site = await prisma.site.findFirst({
    where: { id: siteId, orgId: access.membership.orgId },
  });
  return site;
}

export async function assertSiteWriteAccess(userId: string, siteId: string) {
  const access = await getAccessibleSiteIds(userId);
  if (!access || !canWrite(access.membership.role)) return null;
  return assertSiteAccess(userId, siteId);
}
