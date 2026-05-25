import { redirect } from "next/navigation";
import { getSession, isSga } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MinutesAdmin, { type AdminMeetingDTO } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminMinutesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isSga(session)) redirect("/admin");

  const meetings = await prisma.meeting.findMany({
    include: {
      actionItems: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ pinned: "desc" }, { date: "desc" }],
  });

  const dto: AdminMeetingDTO[] = meetings.map((m) => ({
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
      dueDate: a.dueDate?.toISOString() ?? null,
      status: a.status,
      category: a.category,
    })),
  }));

  return <MinutesAdmin initial={dto} />;
}
