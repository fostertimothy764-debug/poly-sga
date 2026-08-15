import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  await destroySession(session?.adminId);
  return NextResponse.json({ ok: true });
}
