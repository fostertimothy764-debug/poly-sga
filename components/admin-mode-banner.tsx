"use client";

import Link from "next/link";
import { ShieldCheck, LayoutDashboard } from "lucide-react";

/**
 * Shown at the top of public pages when an admin is logged in.
 * Tells them they can edit items inline (hover → pencil icon) and links to dashboard.
 */
export default function AdminModeBanner({ name }: { name: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-poly-navy/15 bg-poly-navy/5 px-5 py-3 text-sm">
      <ShieldCheck size={15} className="text-poly-navy flex-shrink-0" />
      <span className="text-ink-600">
        Editing as <strong className="text-ink-900">{name}</strong>:{" "}
        <span className="text-poly-navy font-medium">hover any item to edit in place</span>
      </span>
      <Link
        href="/admin"
        className="ml-auto flex items-center gap-1.5 rounded-full bg-poly-navy text-white text-xs font-medium px-3 py-1.5 hover:bg-poly-navyDark transition-colors"
      >
        <LayoutDashboard size={12} />
        Dashboard
      </Link>
    </div>
  );
}
