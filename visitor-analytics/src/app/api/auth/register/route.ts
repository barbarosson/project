import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isPrismaSchemaDriftError,
  schemaDriftHint,
} from "@/lib/prisma-errors";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80).optional(),
  orgName: z.string().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: body.name ?? email.split("@")[0],
        memberships: {
          create: {
            role: "owner",
            org: {
              create: {
                name: body.orgName ?? `${body.name ?? "My"} Organization`,
              },
            },
          },
        },
      },
    });

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.flatten() },
        { status: 400 }
      );
    }
    const drift = isPrismaSchemaDriftError(err);
    console.error(
      drift ? `[register] ${schemaDriftHint()}` : "[register]",
      err
    );
    if (drift && process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { error: "Registration failed", hint: schemaDriftHint() },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
