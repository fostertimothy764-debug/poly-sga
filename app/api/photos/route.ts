import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";

// 2 MB expressed as base64 character count (~2.7 MB raw → ~2 MB data)
const MAX_IMAGE_CHARS = 2_800_000;

// Public GET: only return audience:"all" photos. Authenticated officers see everything.
export async function GET(req: NextRequest) {
  const session = await getSession();
  const where = session ? {} : { audience: "all" };
  const photos = await prisma.photo.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { url, title, caption, audience, authorName, eventLabel } = data;

  if (!url?.trim()) {
    return NextResponse.json({ error: "Photo URL or data is required" }, { status: 400 });
  }
  // Guard against huge payloads stored in the DB
  if (url.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ error: "Image is too large. Please use a smaller photo." }, { status: 413 });
  }

  const photo = await prisma.photo.create({
    data: {
      url: url.trim(),
      title: title?.trim() || null,
      caption: caption?.trim() || null,
      audience: audience || "all",
      authorName: authorName?.trim() || session.name,
      eventLabel: eventLabel?.trim() || null,
    },
  });
  return NextResponse.json(photo, { status: 201 });
}

// Only SGA admins/members can edit photos (they manage the gallery)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSga(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const { id, title, caption, audience, eventLabel } = data;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.photo.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title || null }),
      ...(caption !== undefined && { caption: caption || null }),
      ...(audience !== undefined && { audience }),
      ...(eventLabel !== undefined && { eventLabel: eventLabel || null }),
    },
  });
  return NextResponse.json(updated);
}

// Only SGA admins/members can delete photos
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSga(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
