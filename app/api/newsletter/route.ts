import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";

export async function GET() {
  const issues = await prisma.newsletter.findMany({
    orderBy: { publishedAt: "desc" },
  });
  return NextResponse.json(issues);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const { title, issueLabel, description, body, externalUrl, coverUrl, publishedAt } = data;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const issue = await prisma.newsletter.create({
    data: {
      title: title.trim(),
      issueLabel: issueLabel?.trim() || null,
      description: description?.trim() || null,
      body: body?.trim() || null,
      externalUrl: externalUrl?.trim() || null,
      coverUrl: coverUrl?.trim() || null,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
  });
  return NextResponse.json(issue, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const { id, title, issueLabel, description, body, externalUrl, coverUrl, publishedAt } = data;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.newsletter.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(issueLabel !== undefined && { issueLabel: issueLabel || null }),
      ...(description !== undefined && { description: description || null }),
      ...(body !== undefined && { body: body || null }),
      ...(externalUrl !== undefined && { externalUrl: externalUrl || null }),
      ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
      ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.newsletter.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
