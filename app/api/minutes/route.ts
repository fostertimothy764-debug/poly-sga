import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";

const MEETING_TYPES = new Set(["general", "executive", "emergency"]);
const ACTION_STATUSES = new Set(["pending", "in_progress", "completed"]);

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function cleanLines(v: unknown): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, arr) => !(l === "" && (arr[i - 1] === "" || i === 0)))
    .join("\n")
    .trim();
}

export async function GET() {
  const items = await prisma.meeting.findMany({
    include: {
      actionItems: { orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }] },
    },
    orderBy: [{ pinned: "desc" }, { date: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const date = parseDate(body.date);
  if (!date) return NextResponse.json({ error: "Valid date required" }, { status: 400 });

  const type = MEETING_TYPES.has(body.type) ? body.type : "general";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) || null : null;
  const attendees = cleanLines(body.attendees);
  const agenda = cleanLines(body.agenda);
  const decisions = cleanLines(body.decisions);
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const pinned = !!body.pinned;

  if (!attendees) return NextResponse.json({ error: "At least one attendee required" }, { status: 400 });
  if (!agenda && !decisions) {
    return NextResponse.json({ error: "Agenda or decisions required" }, { status: 400 });
  }

  const incomingItems = Array.isArray(body.actionItems) ? body.actionItems : [];
  const sanitizedItems: {
    description: string;
    assignee: string;
    dueDate: Date | null;
    category: string | null;
    status: string;
  }[] = [];
  for (const it of incomingItems) {
    const description = typeof it?.description === "string" ? it.description.trim() : "";
    const assignee = typeof it?.assignee === "string" ? it.assignee.trim() : "";
    if (!description || !assignee) continue;
    sanitizedItems.push({
      description: description.slice(0, 500),
      assignee: assignee.slice(0, 120),
      dueDate: parseDate(it.dueDate),
      category: typeof it.category === "string" && it.category.trim() ? it.category.trim().slice(0, 60) : null,
      status: ACTION_STATUSES.has(it.status) ? it.status : "pending",
    });
  }

  if (pinned) {
    await prisma.meeting.updateMany({ where: { pinned: true }, data: { pinned: false } });
  }

  const created = await prisma.meeting.create({
    data: {
      date,
      type,
      title,
      attendees,
      agenda,
      decisions,
      notes,
      pinned,
      authorName: session!.name,
      actionItems: { create: sanitizedItems },
    },
    include: { actionItems: true },
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
  if ("date" in body) {
    const d = parseDate(body.date);
    if (!d) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    updates.date = d;
  }
  if (typeof body.type === "string" && MEETING_TYPES.has(body.type)) updates.type = body.type;
  if ("title" in body) {
    updates.title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 160) : null;
  }
  if (typeof body.attendees === "string") updates.attendees = cleanLines(body.attendees);
  if (typeof body.agenda === "string") updates.agenda = cleanLines(body.agenda);
  if (typeof body.decisions === "string") updates.decisions = cleanLines(body.decisions);
  if ("notes" in body) {
    updates.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }
  if (typeof body.pinned === "boolean") {
    updates.pinned = body.pinned;
    if (body.pinned) {
      await prisma.meeting.updateMany({
        where: { pinned: true, NOT: { id: body.id } },
        data: { pinned: false },
      });
    }
  }

  const updated = await prisma.meeting.update({
    where: { id: body.id },
    data: updates,
    include: { actionItems: true },
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

  await prisma.meeting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
