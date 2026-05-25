import { redirect } from "next/navigation";
import { getSession, isSga } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InitiativesAdmin, { type AdminInitiativeDTO, type SuggestionDTO } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminInitiativesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isSga(session)) redirect("/admin");

  const [initiatives, suggestions] = await Promise.all([
    prisma.initiative.findMany({
      include: { updates: { orderBy: { createdAt: "desc" } } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
    prisma.initiativeSuggestion.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const initDto: AdminInitiativeDTO[] = initiatives.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    owner: i.owner,
    column: i.column,
    category: i.category,
    startedAt: i.startedAt?.toISOString() ?? null,
    expectedAt: i.expectedAt?.toISOString() ?? null,
    completedAt: i.completedAt?.toISOString() ?? null,
    updates: i.updates.map((u) => ({
      id: u.id,
      body: u.body,
      authorName: u.authorName,
      createdAt: u.createdAt.toISOString(),
    })),
  }));

  const sugDto: SuggestionDTO[] = suggestions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    submitterName: s.submitterName,
    submitterGrade: s.submitterGrade,
    status: s.status,
    reviewerNote: s.reviewerNote,
    createdAt: s.createdAt.toISOString(),
  }));

  return <InitiativesAdmin initiatives={initDto} suggestions={sugDto} />;
}
