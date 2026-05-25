import { prisma } from "@/lib/db";
import BudgetClient, { type BudgetPeriodDTO } from "./client";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const periods = await prisma.budgetPeriod.findMany({
    include: { lines: { orderBy: [{ category: "asc" }, { label: "asc" }] } },
    orderBy: [{ current: "desc" }, { startsAt: "desc" }],
  });

  const dto: BudgetPeriodDTO[] = periods.map((p) => ({
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

  return <BudgetClient initial={dto} />;
}
