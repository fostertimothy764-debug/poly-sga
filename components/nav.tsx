"use client";

import Image from "next/image";
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

type NavItem = { href: string; label: string; blurb: string };

// Home / Events / Ideas / Clubs / Team live on the mobile bottom tab bar
// (components/bottom-tab-bar.tsx) — mobile menu groups below only need the rest,
// so the two nav layers don't duplicate the same destinations.
const BOTTOM_TAB_HREFS = new Set(["/", "/events", "/suggestions", "/clubs", "/team"]);

const weeklyLinks: NavItem[] = [
  { href: "/announcements", label: "Announcements", blurb: "The official record" },
  { href: "/events", label: "Events", blurb: "What's on the calendar" },
  { href: "/scoop", label: "Scoop", blurb: "The newsletter, issue by issue" },
  { href: "/photos", label: "Photos", blurb: "The photo desk" },
];

const involvedLinks: NavItem[] = [
  { href: "/clubs", label: "Clubs", blurb: "Find your people" },
  { href: "/suggestions", label: "Ideas", blurb: "Vote on what SGA does next" },
  { href: "/links", label: "Links", blurb: "Forms, sign-ups, documents" },
];

const transparencyLinks: NavItem[] = [
  { href: "/minutes", label: "Meeting minutes", blurb: "Every meeting, on the record" },
  { href: "/initiatives", label: "Initiatives", blurb: "What we're actually working on" },
  { href: "/budget", label: "Budget", blurb: "Where the money goes" },
  { href: "/accountability", label: "Accountability", blurb: "Action items, on the clock" },
  { href: "/voice", label: "Student voice", blurb: "Speak up — anonymously if you want" },
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

/** A top-nav item that opens a small menu of related pages, e.g. Transparency. */
function NavDropdown({
  label,
  eyebrow,
  blurb,
  items,
  pathname,
  align = "left",
}: {
  label: string;
  eyebrow: string;
  blurb: string;
  items: NavItem[];
  pathname: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const active = items.some((l) => pathname.startsWith(l.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "relative inline-flex items-center gap-1 px-2.5 lg:px-3 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
          active ? "text-poly-navy font-semibold" : "text-ink-500 hover:text-poly-navy"
        )}
      >
        {active && <span className="absolute inset-0 rounded-full bg-poly-navy/8" />}
        <span className="relative">{label}</span>
        <ChevronDown
          size={13}
          className={cn("relative transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute mt-2 w-72 rounded-2xl border border-ink-200 bg-white shadow-overlay overflow-hidden animate-fade-in",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="px-4 pt-3 pb-2 border-b border-ink-100">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-mono">
              {eyebrow}
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5">{blurb}</p>
          </div>
          <ul className="py-1.5">
            {items.map((l) => {
              const itemActive = pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    role="menuitem"
                    className={cn(
                      "flex flex-col gap-0.5 px-4 py-2.5 transition-colors",
                      itemActive ? "bg-poly-navy/5 text-poly-navy" : "text-ink-800 hover:bg-ink-50"
                    )}
                  >
                    <span className="text-sm font-medium">{l.label}</span>
                    <span className="text-[11px] text-ink-500 leading-snug">{l.blurb}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** A labeled group of links inside the mobile menu, e.g. "The Weekly" or "Transparency". */
function MobileGroup({
  eyebrow,
  items,
  pathname,
}: {
  eyebrow: string;
  items: NavItem[];
  pathname: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-ink-200">
      <p className="px-4 pb-2 text-[10px] uppercase tracking-[0.16em] text-ink-500 font-mono">
        {eyebrow}
      </p>
      {items.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              active ? "bg-poly-navy text-white" : "text-ink-700 hover:bg-ink-100"
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
  );
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
  const homeActive = pathname === "/";
  const teamActive = pathname.startsWith("/team");

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

  const mobileWeekly = weeklyLinks.filter((l) => !BOTTOM_TAB_HREFS.has(l.href));
  const mobileInvolved = involvedLinks.filter((l) => !BOTTOM_TAB_HREFS.has(l.href));

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
          <Image
            src="https://cmsv2-assets.apptegy.net/uploads/17625/logo/20148/Polytechnic_logo.png"
            alt="Baltimore Polytechnic Institute"
            width={36}
            height={36}
            className="h-9 w-9 object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
          />
          <span className="font-display text-xl tracking-tight">
            Poly <span className="text-poly-orange">SGA</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          <Link
            href="/"
            className={cn(
              "relative px-2.5 lg:px-3 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
              homeActive ? "text-poly-navy font-semibold" : "text-ink-500 hover:text-poly-navy"
            )}
          >
            {homeActive && <span className="absolute inset-0 rounded-full bg-poly-navy/8" />}
            <span className="relative">Home</span>
          </Link>

          <NavDropdown
            label="The Weekly"
            eyebrow="The Weekly"
            blurb="Everything published this week."
            items={weeklyLinks}
            pathname={pathname}
            align="left"
          />

          <NavDropdown
            label="Get Involved"
            eyebrow="Get involved"
            blurb="Ways to take part."
            items={involvedLinks}
            pathname={pathname}
            align="left"
          />

          <Link
            href="/team"
            className={cn(
              "relative px-2.5 lg:px-3 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
              teamActive ? "text-poly-navy font-semibold" : "text-ink-500 hover:text-poly-navy"
            )}
          >
            {teamActive && <span className="absolute inset-0 rounded-full bg-poly-navy/8" />}
            <span className="relative">Team</span>
          </Link>

          <NavDropdown
            label="Transparency"
            eyebrow="Transparency suite"
            blurb="Every decision, on the record."
            items={transparencyLinks}
            pathname={pathname}
            align="right"
          />
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
            <MobileGroup eyebrow="The Weekly" items={mobileWeekly} pathname={pathname} />
            <MobileGroup eyebrow="Get involved" items={mobileInvolved} pathname={pathname} />
            <MobileGroup eyebrow="Transparency" items={transparencyLinks} pathname={pathname} />
            {isOfficer ? (
              <>
                <Link
                  href="/admin"
                  className="mt-3 pt-3 border-t border-ink-200 px-4 py-3 rounded-xl text-sm font-medium text-poly-orangeDark bg-poly-orange/10 hover:bg-poly-orange/20"
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
                className="mt-3 pt-3 border-t border-ink-200 px-4 py-3 text-left text-sm font-medium text-ink-500 hover:bg-ink-100 rounded-xl"
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
