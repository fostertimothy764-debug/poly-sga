import { prisma } from "@/lib/db";
import InitiativesClient, { type InitiativeDTO } from "./client";

export const dynamic = "force-dynamic";

export default async function InitiativesPage() {
  const items = await prisma.initiative.findMany({
    include: {
      updates: { orderBy: { createdAt: "desc" }, take: 6 },
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const dto: InitiativeDTO[] = items.map((i) => ({
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

  return <InitiativesClient initial={dto} />;
}
