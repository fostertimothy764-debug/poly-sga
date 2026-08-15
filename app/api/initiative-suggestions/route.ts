import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const STATUSES = new Set(["pending", "approved", "declined"]);

// GET — admin sees pending suggestions queue; public not exposed here.
export async function GET() {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await prisma.initiativeSuggestion.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

// POST — open to the public (no session required)
export async function POST(req: NextRequest) {
  if (!(await checkRateLimit(`initiative-suggestions:${clientIp(req)}`, 5, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many submissions — try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!title || !description) {
    return NextResponse.json({ error: "title and description required" }, { status: 400 });
  }

  const submitterName =
    typeof body.submitterName === "string" && body.submitterName.trim()
      ? body.submitterName.trim().slice(0, 80)
      : null;
  const submitterGrade =
    typeof body.submitterGrade === "string" && body.submitterGrade.trim()
      ? body.submitterGrade.trim().slice(0, 8)
      : null;

  const created = await prisma.initiativeSuggestion.create({
    data: {
      title: title.slice(0, 160),
      description: description.slice(0, 2000),
      submitterName,
      submitterGrade,
    },
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.status === "string" && STATUSES.has(body.status)) {
    updates.status = body.status;
    updates.reviewedAt = body.status === "pending" ? null : new Date();
  }
  if ("reviewerNote" in body) {
    updates.reviewerNote =
      typeof body.reviewerNote === "string" && body.reviewerNote.trim()
        ? body.reviewerNote.trim().slice(0, 500)
        : null;
  }

  const updated = await prisma.initiativeSuggestion.update({
    where: { id: body.id },
    data: updates,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.initiativeSuggestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
