import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const TYPES = new Set(["concern", "question", "suggestion"]);
const STATUSES = new Set(["received", "under_review", "addressed", "declined"]);

// Crockford-friendly alphabet — drops I, O, 0, 1 to keep tickets human-readable
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateTicket(): string {
  let out = "V-";
  for (let i = 0; i < 5; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

async function uniqueTicket(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const t = generateTicket();
    const existing = await prisma.voiceSubmission.findUnique({ where: { ticket: t } });
    if (!existing) return t;
  }
  // 60M ticket-space, the loop above all-but guarantees a hit; fall back to cuid suffix
  return `V-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

// GET — public-safe listing. Authenticated officers see everything, public sees the resolved feed.
export async function GET(req: NextRequest) {
  const session = await getSession();
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "public";
  const voterId = req.cookies.get("poly_voter")?.value ?? null;

  let where: Record<string, unknown> = {};
  if (!isSga(session)) {
    // Public view: only public-visible items in resolved or visible states.
    where = { isPublic: true };
  } else if (scope === "queue") {
    where = { status: { in: ["received", "under_review"] } };
  } else if (scope === "all") {
    where = {};
  }

  const items = await prisma.voiceSubmission.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: voterId
      ? {
          votesList: {
            where: { voterId },
            select: { id: true },
          },
        }
      : undefined,
  });

  // Strip submitter name for anonymous items in public responses.
  const filtered = items.map((i) => {
    const exposeName = !i.isAnonymous && !!i.submitterName;
    return {
      id: i.id,
      ticket: i.ticket,
      body: i.body,
      type: i.type,
      submitterName: exposeName ? i.submitterName : null,
      submitterGrade: exposeName ? i.submitterGrade : null,
      isAnonymous: i.isAnonymous,
      status: i.status,
      responseBody: i.responseBody,
      respondedAt: i.respondedAt?.toISOString() ?? null,
      responderName: i.responderName,
      declineReason: i.declineReason,
      votes: i.votes,
      voted: voterId ? (i as { votesList?: { id: string }[] }).votesList?.length === 1 : false,
      createdAt: i.createdAt.toISOString(),
    };
  });

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  if (!(await checkRateLimit(`voice:${clientIp(req)}`, 5, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many submissions — try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text || text.length < 8) {
    return NextResponse.json(
      { error: "Tell us a little more — at least a sentence." },
      { status: 400 }
    );
  }

  const type = TYPES.has(body.type) ? body.type : "suggestion";
  const isAnonymous = body.isAnonymous !== false; // default true unless explicitly false
  const submitterName =
    !isAnonymous && typeof body.submitterName === "string" && body.submitterName.trim()
      ? body.submitterName.trim().slice(0, 80)
      : null;
  const submitterGrade =
    typeof body.submitterGrade === "string" && body.submitterGrade.trim()
      ? body.submitterGrade.trim().slice(0, 8)
      : null;

  const ticket = await uniqueTicket();

  const created = await prisma.voiceSubmission.create({
    data: {
      ticket,
      body: text.slice(0, 4000),
      type,
      isAnonymous,
      submitterName,
      submitterGrade,
    },
  });

  return NextResponse.json(
    { ok: true, ticket: created.ticket, id: created.id },
    { status: 201 }
  );
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
    if (body.status === "addressed" || body.status === "declined") {
      updates.respondedAt = new Date();
      updates.responderName = session!.name;
    }
  }
  if ("responseBody" in body) {
    updates.responseBody =
      typeof body.responseBody === "string" && body.responseBody.trim()
        ? body.responseBody.trim().slice(0, 2000)
        : null;
  }
  if ("declineReason" in body) {
    updates.declineReason =
      typeof body.declineReason === "string" && body.declineReason.trim()
        ? body.declineReason.trim().slice(0, 500)
        : null;
  }
  if (typeof body.isPublic === "boolean") updates.isPublic = body.isPublic;

  const updated = await prisma.voiceSubmission.update({
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

  await prisma.voiceSubmission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

