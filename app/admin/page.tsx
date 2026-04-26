import { redirect } from "next/navigation";
import { getSession, isSga, isSgaAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // Audience filter for what THIS admin sees in the dashboard
  let audienceWhere: object = {};
  if (session.role === "class" && session.classYear) {
    audienceWhere = { audience: { in: ["all", session.classYear] } };
  } else if (session.role === "club" && session.clubId) {
    audienceWhere = {
      OR: [
        { audience: { in: ["all"] } },
        { audience: "club", clubId: session.clubId },
      ],
    };
  }

  // Suggestions that this admin should see in their inbox
  let suggestionWhere: object = {};
  if (session.role === "class" && session.classYear) {
    suggestionWhere = { target: session.classYear };
  } else if (session.role === "club" && session.clubId) {
    suggestionWhere = { target: "club", clubId: session.clubId };
  }
  // SGA roles see everything

  const isAdmin = isSgaAdmin(session);

  const [announcements, events, team, suggestions, unread, clubs, accounts, clubRequests] =
    await Promise.all([
      prisma.announcement.findMany({
        where: audienceWhere,
        include: { club: true },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      }),
      prisma.event.findMany({
        where: audienceWhere,
        include: { club: true },
        orderBy: { startsAt: "asc" },
      }),
      isSga(session)
        ? prisma.teamMember.findMany({
            orderBy: [{ order: "asc" }, { name: "asc" }],
          })
        : Promise.resolve([]),
      prisma.suggestion.findMany({
        where: suggestionWhere,
        include: { club: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.suggestion.count({ where: { ...suggestionWhere, read: false } }),
      prisma.club.findMany({ orderBy: { name: "asc" } }),
      // Accounts & club requests — sga_admin only
      isAdmin
        ? prisma.admin.findMany({
            orderBy: [{ role: "asc" }, { name: "asc" }],
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
              classYear: true,
              clubId: true,
              teamMemberId: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
      isAdmin
        ? prisma.clubRequest.findMany({ orderBy: { createdAt: "desc" } })
        : Promise.resolve([]),
    ]);

  return (
    <AdminDashboard
      session={session}
      capabilities={{
        canManageTeam: isAdmin,
        canManageClubs: isAdmin,
        canRedirect: isAdmin,
        canManageAccounts: isAdmin,
      }}
      initial={{ announcements, events, team, suggestions, unread, clubs, accounts, clubRequests }}
    />
  );
}
