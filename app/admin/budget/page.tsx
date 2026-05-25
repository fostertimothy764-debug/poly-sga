import { redirect } from "next/navigation";
import { getSession, isSga } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BudgetAdmin, { type AdminPeriodDTO } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminBudgetPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isSga(session)) redirect("/admin");

  const periods = await prisma.budgetPeriod.findMany({
    include: { lines: { orderBy: [{ category: "asc" }, { label: "asc" }] } },
    orderBy: [{ current: "desc" }, { startsAt: "desc" }],
  });

  const dto: AdminPeriodDTO[] = periods.map((p) => ({
    id: p.id,
    label: p.label,
    startsAt: p.startsAt.toISOString(),
    endsAt: p.endsAt.toISOString(),
    total: p.total,
    current: p.current,
    notes: p.notes,
    updatedAt: p.updatedAt.toISOString(),
    lines: p.lines.map((l) => ({
      id: l.id,
      category: l.category,
      label: l.label,
      allocated: l.allocated,
      spent: l.spent,
      note: l.note,
    })),
  }));

  return <BudgetAdmin initial={dto} />;
}
