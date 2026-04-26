"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AudienceFilter({
  currentView,
  gradeLabel,
}: {
  currentView: string;
  gradeLabel?: string;
}) {
  const params = useSearchParams();

  const tabs = [
    { value: "mine", label: gradeLabel ? `For ${gradeLabel}` : "For me" },
    { value: "school", label: "Schoolwide only" },
    { value: "all", label: "Everything" },
  ];

  function href(view: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("view", view);
    return `?${sp.toString()}`;
  }

  return (
    <div className="flex flex-wrap gap-1 mb-8 p-1 rounded-full bg-ink-100 w-fit">
      {tabs.map((t) => (
        <Link
          key={t.value}
          href={href(t.value)}
          scroll={false}
          className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
            currentView === t.value
              ? "bg-white text-ink-900 shadow-sm"
              : "text-ink-600 hover:text-ink-900"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
