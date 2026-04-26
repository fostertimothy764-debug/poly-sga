import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canPostAudience, canPostToClub } from "@/lib/auth";

export async function GET() {
  const items = await prisma.announcement.findMany({
    include: { club: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { title, body: text, pinned, audience, clubId } = data || {};
  if (!title || !text) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  // Resolve audience
  let finalAudience: string;
  let finalClubId: string | null = null;

  if (audience === "club") {
    if (!clubId || typeof clubId !== "string") {
      return NextResponse.json({ error: "clubId required for club audience" }, { status: 400 });
    }
    if (!canPostToClub(session, clubId)) {
      return NextResponse.json({ error: "You can't post to this club" }, { status: 403 });
    }
    finalAudience = "club";
    finalClubId = clubId;
  } else {
    // Default audience for the role
    const audienceVal =
      typeof audience === "string" && ["all", "27", "28", "29", "30"].includes(audience)
        ? audience
        : session.role === "class" && session.classYear
          ? session.classYear
          : "all";
    if (!canPostAudience(session, audienceVal)) {
      return NextResponse.json({ error: "Forbidden audience" }, { status: 403 });
    }
    finalAudience = audienceVal;
  }

  const created = await prisma.announcement.create({
    data: {
      title,
      body: text,
      pinned: !!pinned,
      audience: finalAudience,
      clubId: finalClubId,
      authorName: session.name,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

async function checkEditPermission(id: string) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 } as const;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return { error: "Not found", status: 404 } as const;
  if (existing.audience === "club") {
    if (!existing.clubId || !canPostToClub(session, existing.clubId)) {
      return { error: "Forbidden", status: 403 } as const;
    }
  } else {
    if (!canPostAudience(session, existing.audience)) {
      return { error: "Forbidden", status: 403 } as const;
    }
  }
  return { session, existing } as const;
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const check = await checkEditPermission(id);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const check = await checkEditPermission(id);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const updated = await prisma.announcement.update({ where: { id }, data });
  return NextResponse.json(updated);
}
