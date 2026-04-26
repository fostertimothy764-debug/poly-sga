import { redirect } from "next/navigation";
import { getSession, roleLabel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileClient from "./client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    include: { teamMember: true, club: true },
  });
  if (!admin) redirect("/admin/login");

  return (
    <ProfileClient
      account={{
        username: admin.username,
        name: admin.name,
        role: admin.role,
        roleLabel: roleLabel({
          role: admin.role as "sga_admin" | "sga_member" | "class" | "club",
          classYear: admin.classYear,
          clubId: admin.clubId,
        }),
        clubName: admin.club?.name ?? null,
        classYear: admin.classYear,
      }}
      teamMember={
        admin.teamMember
          ? {
              id: admin.teamMember.id,
              name: admin.teamMember.name,
              role: admin.teamMember.role,
              grade: admin.teamMember.grade,
              bio: admin.teamMember.bio,
              photoUrl: admin.teamMember.photoUrl,
            }
          : null
      }
    />
  );
}
