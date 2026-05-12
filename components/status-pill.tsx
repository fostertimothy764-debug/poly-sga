import { Check } from "lucide-react";

export type SuggestionStatus =
  | "new"
  | "under_review"
  | "on_the_agenda"
  | "in_progress"
  | "done"
  | "declined"
  | "custom";

export const STATUS_OPTIONS: { value: SuggestionStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under review" },
  { value: "on_the_agenda", label: "On the agenda" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
  { value: "custom", label: "Custom…" },
];

const STATUS_CLASSES: Record<SuggestionStatus, string> = {
  new: "border-ink-200 bg-ink-100 text-ink-600",
  under_review: "border-poly-amber/30 bg-poly-amber/10 text-poly-amber",
  on_the_agenda: "border-poly-navy/30 bg-poly-navySoft text-poly-navy",
  in_progress: "border-poly-orange/30 bg-poly-orangeSoft text-poly-orangeDark",
  done: "border-poly-green/40 bg-poly-green/15 text-poly-green",
  declined: "border-ink-200 bg-ink-100 text-ink-500",
  custom: "border-poly-navy/30 bg-poly-navy/8 text-poly-navy",
};

export function statusDisplayLabel(
  status: SuggestionStatus,
  customLabel: string | null,
) {
  if (status === "custom") return (customLabel || "Custom").trim().slice(0, 32);
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? "New";
}

export default function StatusPill({
  status,
  statusLabel,
  size = "sm",
  className = "",
}: {
  status: SuggestionStatus | string | null;
  statusLabel?: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const s = (status || "new") as SuggestionStatus;
  const padding = size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";
  const tone = STATUS_CLASSES[s] ?? STATUS_CLASSES.new;
  const label = statusDisplayLabel(s, statusLabel ?? null);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${padding} font-mono font-semibold uppercase tracking-[0.06em] ${tone} ${
        s === "declined" ? "line-through" : ""
      } ${className}`}
    >
      {s === "done" && <Check size={11} strokeWidth={3} />}
      {label}
    </span>
  );
}
