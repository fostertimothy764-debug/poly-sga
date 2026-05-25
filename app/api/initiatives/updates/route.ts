import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.initiativeId) {
    return NextResponse.json({ error: "initiativeId required" }, { status: 400 });
  }
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "body required" }, { status: 400 });

  const created = await prisma.initiativeUpdate.create({
    data: {
      initiativeId: body.initiativeId,
      body: text.slice(0, 1000),
      authorName: session!.name,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.initiativeUpdate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
