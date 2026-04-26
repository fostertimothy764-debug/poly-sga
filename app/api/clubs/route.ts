import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canManageClubs } from "@/lib/auth";

export async function GET() {
  const items = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(items);
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canManageClubs(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const { name, description, meetingTime, location, photoUrl, slug: rawSlug } = data || {};
  if (!name || !description) {
    return NextResponse.json({ error: "Name and description required" }, { status: 400 });
  }

  let slug = (typeof rawSlug === "string" && rawSlug.trim()) ? slugify(rawSlug) : slugify(name);
  if (!slug) slug = `club-${Date.now()}`;

  // Ensure unique
  let unique = slug;
  let n = 1;
  while (await prisma.club.findUnique({ where: { slug: unique } })) {
    n += 1;
    unique = `${slug}-${n}`;
  }

  const created = await prisma.club.create({
    data: {
      slug: unique,
      name: name.trim(),
      description: description.trim(),
      meetingTime: meetingTime || null,
      location: location || null,
      photoUrl: photoUrl || null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
