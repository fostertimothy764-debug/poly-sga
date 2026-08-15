"use client";

import { usePathname } from "next/navigation";
import Nav from "./nav";
import Footer from "./footer";
import BottomTabBar from "./bottom-tab-bar";
import NewsWire, { type WireItem } from "./news-wire";
import type { Grade } from "@/lib/grade";
import type { AdminRole } from "@/lib/auth";
import type { FooterCopy } from "./footer";

export default function Shell({
  children,
  grade,
  officerName,
  officerRole,
  wireItems,
  footer,
}: {
  children: React.ReactNode;
  grade: Grade | null;
  officerName: string | null;
  officerRole: AdminRole | null;
  wireItems: WireItem[];
  footer: FooterCopy;
}) {
  const pathname = usePathname();
  const isWelcome = pathname === "/welcome";

  if (isWelcome) {
    return <>{children}</>;
  }

  const hasWire = wireItems.length > 0;

  return (
    <>
      <Nav grade={grade} officerName={officerName} officerRole={officerRole} />
      {hasWire && <NewsWire items={wireItems} />}
      {/* main top-pad = fixed nav (h-20 = 80px) + wire band (h-9 = 36px) = 116px ≈ 7.25rem */}
      {/* pb-16 on mobile to clear the bottom tab bar */}
      <main
        className={`min-h-[calc(100vh-200px)] ${hasWire ? "pt-[7.25rem]" : "pt-20"} pb-16 md:pb-0`}
      >
        <div key={pathname} className="animate-page-in">
          {children}
        </div>
      </main>
      <Footer copy={footer} />
      <BottomTabBar />
    </>
  );
}
