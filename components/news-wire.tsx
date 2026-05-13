"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type WireItem = {
  label: string;
  text: string;
  href: string;
};

const ROTATE_MS = 7000;
const FADE_MS = 280;

export default function NewsWire({ items }: { items: WireItem[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const tick = setInterval(() => {
      if (reduced) {
        setIndex((i) => (i + 1) % items.length);
        return;
      }
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => clearInterval(tick);
  }, [items.length, paused]);

  if (items.length === 0) return null;
  const item = items[index];
  const showProgress = items.length > 1;

  return (
    <div
      className="fixed inset-x-0 top-20 z-40 h-9 border-b border-ink-200 bg-ink-50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="container-page h-full flex items-center gap-2 sm:gap-3 text-[11px]">
        <span className="font-mono uppercase tracking-[0.18em] text-ink-700 shrink-0">
          Now
        </span>
        <span className="text-ink-300 shrink-0" aria-hidden>
          ·
        </span>
        <Link
          href={item.href}
          className="min-w-0 flex-1 flex items-baseline gap-2 sm:gap-2.5 group rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-poly-navy focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50"
        >
          <span
            className={`min-w-0 flex items-baseline gap-2 sm:gap-2.5 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="font-mono uppercase tracking-[0.14em] text-poly-navy shrink-0">
              {item.label}
            </span>
            <span className="text-ink-300 shrink-0" aria-hidden>
              ·
            </span>
            <span className="truncate text-ink-800 group-hover:text-poly-navy group-hover:underline underline-offset-[3px] decoration-ink-300 transition-colors">
              {item.text}
            </span>
          </span>
        </Link>
      </div>
      {showProgress && (
        <span
          key={index}
          aria-hidden
          className="absolute left-0 bottom-0 h-px bg-poly-navy/40 wire-progress"
          style={{
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      )}
      <style jsx>{`
        @keyframes wire-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .wire-progress {
          animation: wire-progress ${ROTATE_MS}ms linear forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .wire-progress {
            animation: none;
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
