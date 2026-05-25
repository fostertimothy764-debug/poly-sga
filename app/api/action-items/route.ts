import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";

const ACTION_STATUSES = new Set(["pending", "in_progress", "completed"]);

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// Aggregated GET — powers /accountability. Always returns hydrated meeting context.
export async function GET() {
  const items = await prisma.actionItem.findMany({
    include: {
      meeting: {
        select: { id: true, date: true, type: true, title: true },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.meetingId) return NextResponse.json({ error: "meetingId required" }, { status: 400 });

  const description = typeof body.description === "string" ? body.description.trim() : "";
  const assignee = typeof body.assignee === "string" ? body.assignee.trim() : "";
  if (!description || !assignee) {
    return NextResponse.json({ error: "description and assignee required" }, { status: 400 });
  }

  const created = await prisma.actionItem.create({
    data: {
      meetingId: body.meetingId,
      description: description.slice(0, 500),
      assignee: assignee.slice(0, 120),
      dueDate: parseDate(body.dueDate),
      category:
        typeof body.category === "string" && body.category.trim()
          ? body.category.trim().slice(0, 60)
          : null,
      status: ACTION_STATUSES.has(body.status) ? body.status : "pending",
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.description === "string" && body.description.trim()) {
    updates.description = body.description.trim().slice(0, 500);
  }
  if (typeof body.assignee === "string" && body.assignee.trim()) {
    updates.assignee = body.assignee.trim().slice(0, 120);
  }
  if ("dueDate" in body) updates.dueDate = parseDate(body.dueDate);
  if ("category" in body) {
    updates.category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim().slice(0, 60)
        : null;
  }
  if (typeof body.status === "string" && ACTION_STATUSES.has(body.status)) {
    updates.status = body.status;
    updates.completedAt = body.status === "completed" ? new Date() : null;
  }

  const updated = await prisma.actionItem.update({ where: { id: body.id }, data: updates });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.actionItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
