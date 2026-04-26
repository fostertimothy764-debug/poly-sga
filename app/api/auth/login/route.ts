import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, AdminRole } from "@/lib/auth";

const GRADE_COOKIE = "poly_grade";

export async function POST(req: NextRequest) {
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
  if (!admin) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession({
    adminId: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role as AdminRole,
    classYear: admin.classYear,
    clubId: admin.clubId,
    teamMemberId: admin.teamMemberId,
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
