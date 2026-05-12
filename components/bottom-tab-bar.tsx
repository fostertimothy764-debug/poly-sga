"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Lightbulb, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/events", label: "Events", Icon: Calendar },
  { href: "/suggestions", label: "Ideas", Icon: Lightbulb },
  { href: "/clubs", label: "Clubs", Icon: Users },
  { href: "/team", label: "Team", Icon: User },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex md:hidden border-t border-ink-200 bg-white"
      aria-label="Main navigation"
    >
      <div className="flex w-full pb-safe">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-poly-orange" : "text-ink-400 hover:text-ink-700"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.75}
                className="transition-transform active:scale-90"
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
