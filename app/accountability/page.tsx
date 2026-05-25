import { prisma } from "@/lib/db";
import AccountabilityClient, { type AccountabilityItem } from "./client";

export const dynamic = "force-dynamic";

export default async function AccountabilityPage() {
  const items = await prisma.actionItem.findMany({
    include: {
      meeting: { select: { id: true, date: true, type: true, title: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  const dto: AccountabilityItem[] = items.map((a) => ({
    id: a.id,
    description: a.description,
    assignee: a.assignee,
    dueDate: a.dueDate?.toISOString() ?? null,
    status: a.status,
    category: a.category,
    completedAt: a.completedAt?.toISOString() ?? null,
    meeting: {
      id: a.meeting.id,
      date: a.meeting.date.toISOString(),
      type: a.meeting.type,
      title: a.meeting.title,
    },
  }));

  return <AccountabilityClient initial={dto} />;
}
