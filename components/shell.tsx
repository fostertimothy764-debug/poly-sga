"use client";

import { usePathname } from "next/navigation";
import Nav from "./nav";
import Footer from "./footer";
import type { Grade } from "@/lib/grade";
import type { AdminRole } from "@/lib/auth";

export default function Shell({
  children,
  grade,
  officerName,
  officerRole,
}: {
  children: React.ReactNode;
  grade: Grade | null;
  officerName: string | null;
  officerRole: AdminRole | null;
}) {
  const pathname = usePathname();
  const isWelcome = pathname === "/welcome";

  if (isWelcome) {
    return <>{children}</>;
  }

  return (
    <>
      <Nav grade={grade} officerName={officerName} officerRole={officerRole} />
      <main className="min-h-[calc(100vh-200px)] pt-20">
        {/* Thin gradient accent line just below nav */}
        <div
          className="h-px bg-gradient-to-r from-poly-orange/70 via-poly-navy/50 to-transparent"
          aria-hidden
        />
        <div key={pathname} className="animate-page-in">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
