"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

type Photo = {
  id: string;
  title: string | null;
  caption: string | null;
  url: string;
  audience: string;
  authorName: string | null;
  eventLabel: string | null;
  createdAt: Date | string;
};

export default function PhotoGallery({
  labelled,
  unlabelled,
}: {
  labelled: Record<string, Photo[]>;
  unlabelled: Photo[];
}) {
  const [lightbox, setLightbox] = useState<{ photos: Photo[]; index: number } | null>(null);

  function open(photos: Photo[], index: number) {
    setLightbox({ photos, index });
  }

  function close() {
    setLightbox(null);
  }

  function prev() {
    if (!lightbox) return;
    setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length });
  }

  function next() {
    if (!lightbox) return;
    setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.photos.length });
  }

  const allPhotos = [...Object.values(labelled).flat(), ...unlabelled];

  return (
    <>
      <div className="space-y-14">
        {/* Labelled groups */}
        {Object.entries(labelled).map(([label, photos]) => (
          <section key={label}>
            <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5 flex items-center gap-3">
              {label}
              <span className="flex-1 h-px bg-ink-100" />
              <span className="text-ink-400">{photos.length} photo{photos.length !== 1 ? "s" : ""}</span>
            </h2>
            <PhotoGrid photos={photos} onOpen={(i) => open(photos, i)} />
          </section>
        ))}

        {/* Unlabelled */}
        {unlabelled.length > 0 && (
          <section>
            {Object.keys(labelled).length > 0 && (
              <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5 flex items-center gap-3">
                Other Photos
                <span className="flex-1 h-px bg-ink-100" />
              </h2>
            )}
            <PhotoGrid photos={unlabelled} onOpen={(i) => open(unlabelled, i)} />
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] bg-poly-navyDark/95 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={close}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={close}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Prev */}
          {lightbox.photos.length > 1 && (
            <button
              className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-4xl max-h-[85vh] mx-16 flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={lightbox.photos[lightbox.index].id}
              src={lightbox.photos[lightbox.index].url}
              alt={lightbox.photos[lightbox.index].caption ?? "Photo"}
              className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            {(lightbox.photos[lightbox.index].caption || lightbox.photos[lightbox.index].title) && (
              <div className="text-center text-white/80 text-sm">
                {lightbox.photos[lightbox.index].title && (
                  <p className="font-medium">{lightbox.photos[lightbox.index].title}</p>
                )}
                {lightbox.photos[lightbox.index].caption && (
                  <p className="text-white/60 text-xs mt-0.5">{lightbox.photos[lightbox.index].caption}</p>
                )}
              </div>
            )}
            <p className="text-white/30 text-xs">
              {lightbox.index + 1} / {lightbox.photos.length}
            </p>
          </div>

          {/* Next */}
          {lightbox.photos.length > 1 && (
            <button
              className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}
    </>
  );
}

function PhotoGrid({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
      {photos.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onOpen(i)}
          className="group w-full break-inside-avoid overflow-hidden rounded-2xl border border-ink-100 relative block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt={p.caption ?? p.title ?? "Photo"}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-poly-navy/0 group-hover:bg-poly-navy/40 transition-colors duration-300 rounded-2xl flex items-end p-3">
            {(p.caption || p.title) && (
              <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-left line-clamp-2">
                {p.title ?? p.caption}
              </p>
            )}
          </div>
          {/* Camera icon fallback */}
          {!p.url && (
            <div className="h-40 bg-ink-100 flex items-center justify-center">
              <ImageIcon size={24} className="text-ink-300" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
