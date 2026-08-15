import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, AdminRole } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const GRADE_COOKIE = "poly_grade";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Per-username lockout (below) stops repeated guessing against ONE account; this
  // per-IP limit additionally stops a horizontal spray across many different
  // usernames from the same source, which the lockout alone wouldn't catch.
  if (!(await checkRateLimit(`login:${clientIp(req)}`, 15, 5 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { username: username.toLowerCase().trim() },
  });
  // Always run a bcrypt.compare, even for an unknown username, against a fixed dummy
  // hash — otherwise "unknown user" responds faster than "wrong password" and an
  // attacker can use that timing difference to enumerate valid usernames.
  const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Yi2A5X7VvpKPl3wLwuQ0Xh1MAUcW6";

  if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !ok) {
    if (admin) {
      const attempts = admin.failedLoginAttempts + 1;
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
        },
      });
    }
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (admin.failedLoginAttempts > 0 || admin.lockedUntil) {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  await createSession({
    adminId: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role as AdminRole,
    isSiteAdmin: admin.siteAdmin,
    isDeveloper: admin.isDeveloper,
    // A fresh login always starts un-elevated — developer actions require a fresh
    // passkey step-up every session, not just a valid password.
    developerElevatedAt: null,
    classYear: admin.classYear,
    clubId: admin.clubId,
    teamMemberId: admin.teamMemberId,
    sessionVersion: admin.sessionVersion,
  });

  // Auto-set the grade cookie so officers bypass the welcome screen.
  // Class officers use their class year; everyone else is treated as "guest".
  const grade =
    admin.role === "class" && admin.classYear ? admin.classYear : "guest";
  cookies().set(GRADE_COOKIE, grade, {
    httpOnly: false, // readable by client so the grade chip in the nav works
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}
