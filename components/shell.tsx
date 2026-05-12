"use client";

import { usePathname } from "next/navigation";
import Nav from "./nav";
import Footer from "./footer";
import BottomTabBar from "./bottom-tab-bar";
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
      {/* pb-16 on mobile to clear the bottom tab bar */}
      <main className="min-h-[calc(100vh-200px)] pt-20 pb-16 md:pb-0">
        <div key={pathname} className="animate-page-in">
          {children}
        </div>
      </main>
      <Footer />
      <BottomTabBar />
    </>
  );
}
