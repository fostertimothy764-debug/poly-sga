"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { relativeTime } from "@/lib/utils";

export type PhotoDeskItem = {
  id: string;
  url: string;
  title: string | null;
  caption: string | null;
  authorName: string | null;
  eventLabel: string | null;
  createdAt: string;
};

const ROTATE_MS = 6000;
const FADE_MS = 500;

function altFor(p: PhotoDeskItem) {
  return (
    p.caption ||
    p.title ||
    (p.eventLabel ? `Photograph from ${p.eventLabel}` : "Photograph from Poly SGA")
  );
}

export default function PhotoDesk({ photos }: { photos: PhotoDeskItem[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLElement | null>(null);
  const onscreenRef = useRef(true);
  const hoveredRef = useRef(false);

  useEffect(() => {
    if (photos.length <= 1) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        onscreenRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.25 },
    );
    if (containerRef.current) observer.observe(containerRef.current);

    const tick = setInterval(() => {
      if (!onscreenRef.current || hoveredRef.current) return;
      if (reduced) {
        setIndex((i) => (i + 1) % photos.length);
        return;
      }
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % photos.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      clearInterval(tick);
      observer.disconnect();
    };
  }, [photos.length]);

  if (photos.length === 0) return null;
  const p = photos[index];
  const isBroken = broken[p.id];
  const captionText = p.caption || p.title || p.eventLabel || "From the photo desk";
  const nextIndex = (index + 1) % photos.length;

  return (
    <section
      ref={containerRef}
      className="mb-14 pb-14 border-b border-ink-200"
      onMouseEnter={() => (hoveredRef.current = true)}
      onMouseLeave={() => (hoveredRef.current = false)}
    >
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="label text-ink-800">From the photo desk</h2>
        <Link
          href="/photos"
          className="text-[11px] uppercase tracking-[0.14em] text-ink-500 hover:text-poly-navy transition-colors"
        >
          All photos
        </Link>
      </div>

      <figure className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-end">
        <Link
          href="/photos"
          className="relative aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-ink-100 border border-ink-200 block group"
        >
          {photos.map((photo, i) => {
            const isCurrent = i === index;
            const isNext = i === nextIndex;
            return (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={photo.id}
                src={photo.url}
                alt={isCurrent ? altFor(photo) : ""}
                loading={isCurrent || isNext ? "eager" : "lazy"}
                aria-hidden={!isCurrent}
                onError={() =>
                  setBroken((prev) =>
                    prev[photo.id] ? prev : { ...prev, [photo.id]: true },
                  )
                }
                className="absolute inset-0 h-full w-full object-cover transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.01] [transition-property:opacity,transform] duration-[600ms]"
                style={{
                  opacity: isCurrent && visible && !broken[photo.id] ? 1 : 0,
                  zIndex: isCurrent ? 1 : 0,
                }}
              />
            );
          })}
          {isBroken && (
            <div className="absolute inset-0 flex items-center justify-center text-ink-400 text-xs uppercase tracking-[0.14em] font-mono">
              Photo unavailable
            </div>
          )}
        </Link>

        <figcaption className="lg:pb-2">
          {p.eventLabel && (
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-poly-navy mb-3">
              {p.eventLabel}
            </p>
          )}
          <p
            key={p.id}
            className="font-display italic text-xl sm:text-2xl font-light leading-snug text-ink-900 mb-3 photo-caption-fade"
          >
            &ldquo;{captionText}&rdquo;
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-500">
            {p.authorName && !isBroken && (
              <span>
                Photograph by{" "}
                <span className="text-ink-800 font-medium">{p.authorName}</span>
              </span>
            )}
            {p.authorName && !isBroken && <span className="text-ink-300">·</span>}
            <span>{relativeTime(new Date(p.createdAt))}</span>
          </div>
        </figcaption>
      </figure>

      <style jsx>{`
        @keyframes photo-caption-fade {
          0% {
            opacity: 0;
            transform: translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .photo-caption-fade {
          animation: photo-caption-fade 600ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .photo-caption-fade {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
