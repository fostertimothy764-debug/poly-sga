import { NextRequest, NextResponse } from "next/server";

const ALLOWED = ["27", "28", "29", "30", "guest"];
const COOKIE = "poly_grade";

export async function POST(req: NextRequest) {
  const { grade } = await req.json();
  if (!ALLOWED.includes(grade)) {
    return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, grade, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
