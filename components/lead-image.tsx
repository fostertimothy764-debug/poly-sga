"use client";

import { useState } from "react";

export default function LeadImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-ink-400 text-xs uppercase tracking-[0.14em] font-mono">
        Photo unavailable
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
