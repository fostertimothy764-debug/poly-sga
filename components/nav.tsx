"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { GraduationCap, LayoutDashboard, Menu, ShieldCheck, X } from "lucide-react";
import type { Grade } from "@/lib/grade";
import type { AdminRole } from "@/lib/auth";

const links = [
  { href: "/", label: "Home" },
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/clubs", label: "Clubs" },
  { href: "/team", label: "Team" },
  { href: "/suggestions", label: "Ideas" },
];

function gradeShort(g: Grade) {
  if (g === "guest") return "Guest";
  return `Class of '${g}`;
}

function officerShort(role: AdminRole) {
  if (role === "sga_admin") return "SGA Admin";
  if (role === "sga_member") return "SGA Officer";
  if (role === "class") return "Class Officer";
  if (role === "club") return "Club Officer";
  return "Officer";
}

export default function Nav({
  grade,
  officerName,
  officerRole,
}: {
  grade: Grade | null;
  officerName: string | null;
  officerRole: AdminRole | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const isOfficer = !!officerName;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function changeGrade() {
    await fetch("/api/grade", { method: "DELETE" });
    router.push("/welcome");
    router.refresh();
  }

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-ink-50/90 backdrop-blur-md border-b border-ink-200/60 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container-page flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="Poly SGA home"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-white text-[11px] font-bold tracking-wider transition-transform group-hover:scale-105">
            <span className="absolute inset-0 rounded-lg bg-poly-orange opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative">P</span>
          </span>
          <span className="font-display text-lg tracking-tight">
            Poly <span className="text-ink-400">SGA</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-3.5 py-2 text-sm font-medium rounded-full transition-colors",
                  active
                    ? "text-ink-900"
                    : "text-ink-500 hover:text-ink-900"
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-ink-100" />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          {isOfficer ? (
            /* Logged-in officer — show name chip + dashboard link */
            <>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-full bg-poly-orange/10 border border-poly-orange/20 px-3 py-1.5 text-xs font-medium text-poly-orangeDark hover:bg-poly-orange/20 transition-colors"
              >
                <ShieldCheck size={12} className="text-poly-orange" />
                {officerName!.split(" ")[0]} · {officerShort(officerRole!)}
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-200 transition-colors"
                title="Dashboard"
              >
                <LayoutDashboard size={12} />
                Dashboard
              </Link>
            </>
          ) : grade ? (
            /* Regular visitor with grade cookie */
            <button
              onClick={changeGrade}
              title="Change class"
              className="flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-200 transition-colors"
            >
              <GraduationCap size={12} />
              {gradeShort(grade)}
            </button>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden p-2 -mr-2 rounded-lg hover:bg-ink-100 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-ink-200/60 bg-ink-50/95 backdrop-blur-md animate-fade-in">
          <nav className="container-page py-4 flex flex-col gap-1">
            {links.map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-ink-900 text-ink-50"
                      : "text-ink-700 hover:bg-ink-100"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
            {isOfficer ? (
              <>
                <Link
                  href="/admin"
                  className="mt-1 px-4 py-3 rounded-xl text-sm font-medium text-poly-orangeDark bg-poly-orange/10 hover:bg-poly-orange/20"
                >
                  <ShieldCheck size={14} className="inline mr-2" />
                  {officerName!.split(" ")[0]} · {officerShort(officerRole!)}
                </Link>
                <Link
                  href="/admin"
                  className="px-4 py-3 rounded-xl text-sm font-medium text-ink-700 hover:bg-ink-100"
                >
                  <LayoutDashboard size={14} className="inline mr-2" />
                  Dashboard
                </Link>
              </>
            ) : grade ? (
              <button
                onClick={changeGrade}
                className="mt-1 px-4 py-3 rounded-xl text-left text-sm font-medium text-ink-500 hover:bg-ink-100"
              >
                <GraduationCap size={14} className="inline mr-2" />
                {gradeShort(grade)} — change class
              </button>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
