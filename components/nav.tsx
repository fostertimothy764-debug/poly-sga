"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Grade } from "@/lib/grade";
import type { AdminRole } from "@/lib/auth";

const links = [
  { href: "/", label: "Home" },
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/links", label: "Links" },
  { href: "/clubs", label: "Clubs" },
  { href: "/photos", label: "Photos" },
  { href: "/scoop", label: "Scoop" },
  { href: "/team", label: "Team" },
  { href: "/suggestions", label: "Ideas" },
];

const transparencyLinks = [
  {
    href: "/minutes",
    label: "Meeting minutes",
    blurb: "Every meeting, on the record",
  },
  {
    href: "/initiatives",
    label: "Initiatives",
    blurb: "What we're actually working on",
  },
  {
    href: "/budget",
    label: "Budget",
    blurb: "Where the money goes",
  },
  {
    href: "/accountability",
    label: "Accountability",
    blurb: "Action items, on the clock",
  },
  {
    href: "/voice",
    label: "Student voice",
    blurb: "Speak up — anonymously if you want",
  },
];

const transparencyHrefs = transparencyLinks.map((l) => l.href);

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
  const [transparencyOpen, setTransparencyOpen] = useState(false);
  const transparencyRef = useRef<HTMLDivElement | null>(null);

  const isOfficer = !!officerName;
  const transparencyActive = transparencyHrefs.some((h) => pathname.startsWith(h));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setTransparencyOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!transparencyOpen) return;
    function onClick(e: MouseEvent) {
      if (!transparencyRef.current?.contains(e.target as Node)) {
        setTransparencyOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTransparencyOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [transparencyOpen]);

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
          ? "bg-ink-50 border-b border-ink-200"
          : "bg-ink-50/95"
      )}
    >
      <div className="container-page flex items-center justify-between h-20">
        {/* Logo — pushed to the far left with extra room before nav links */}
        <Link
          href="/"
          className="flex items-center gap-3 group mr-8"
          aria-label="Poly SGA home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cmsv2-assets.apptegy.net/uploads/17625/logo/20148/Polytechnic_logo.png"
            alt="Baltimore Polytechnic Institute"
            className="h-9 w-9 object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
          />
          <span className="font-display text-xl tracking-tight">
            Poly <span className="text-poly-orange">SGA</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-2.5 lg:px-3 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                  active
                    ? "text-poly-navy font-semibold"
                    : "text-ink-500 hover:text-poly-navy"
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-poly-navy/8" />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}

          {/* Transparency dropdown — Minutes / Initiatives / Budget / Accountability / Voice */}
          <div className="relative" ref={transparencyRef}>
            <button
              type="button"
              onClick={() => setTransparencyOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={transparencyOpen}
              className={cn(
                "relative inline-flex items-center gap-1 px-2.5 lg:px-3 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                transparencyActive
                  ? "text-poly-navy font-semibold"
                  : "text-ink-500 hover:text-poly-navy"
              )}
            >
              {transparencyActive && (
                <span className="absolute inset-0 rounded-full bg-poly-navy/8" />
              )}
              <span className="relative">Transparency</span>
              <ChevronDown
                size={13}
                className={cn(
                  "relative transition-transform duration-200",
                  transparencyOpen && "rotate-180"
                )}
              />
            </button>
            {transparencyOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-72 rounded-2xl border border-ink-200 bg-white shadow-[0_12px_40px_-12px_rgba(10,35,66,0.18)] overflow-hidden animate-fade-in"
              >
                <div className="px-4 pt-3 pb-2 border-b border-ink-100">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-mono">
                    Transparency suite
                  </p>
                  <p className="text-[11px] text-ink-500 mt-0.5">
                    Every decision, on the record.
                  </p>
                </div>
                <ul className="py-1.5">
                  {transparencyLinks.map((l) => {
                    const active = pathname.startsWith(l.href);
                    return (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          role="menuitem"
                          className={cn(
                            "flex flex-col gap-0.5 px-4 py-2.5 transition-colors",
                            active
                              ? "bg-poly-navy/5 text-poly-navy"
                              : "text-ink-800 hover:bg-ink-50"
                          )}
                        >
                          <span className="text-sm font-medium">{l.label}</span>
                          <span className="text-[11px] text-ink-500 leading-snug">
                            {l.blurb}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
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
        <div className="md:hidden border-t border-ink-200 bg-ink-50 animate-fade-in">
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
                      ? "bg-poly-navy text-white"
                      : "text-ink-700 hover:bg-ink-100"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="mt-3 pt-3 border-t border-ink-200">
              <p className="px-4 pb-2 text-[10px] uppercase tracking-[0.16em] text-ink-500 font-mono">
                Transparency
              </p>
              {transparencyLinks.map((l) => {
                const active = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-poly-navy text-white"
                        : "text-ink-700 hover:bg-ink-100"
                    )}
                  >
                    {l.label}
                    <span
                      className={cn(
                        "block text-[11px] mt-0.5 font-normal",
                        active ? "text-white/70" : "text-ink-500"
                      )}
                    >
                      {l.blurb}
                    </span>
                  </Link>
                );
              })}
            </div>
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
