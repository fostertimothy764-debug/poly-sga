import { prisma } from "@/lib/db";
import MinutesClient, { type MeetingDTO } from "./client";

export const dynamic = "force-dynamic";

export default async function MinutesPage() {
  const meetings = await prisma.meeting.findMany({
    include: {
      actionItems: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ pinned: "desc" }, { date: "desc" }],
  });

  const dto: MeetingDTO[] = meetings.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    type: m.type,
    title: m.title,
    attendees: m.attendees,
    agenda: m.agenda,
    decisions: m.decisions,
    notes: m.notes,
    pinned: m.pinned,
    authorName: m.authorName,
    actionItems: m.actionItems.map((a) => ({
      id: a.id,
      description: a.description,
      assignee: a.assignee,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
      status: a.status,
      category: a.category,
    })),
  }));

  return <MinutesClient initial={dto} />;
}
