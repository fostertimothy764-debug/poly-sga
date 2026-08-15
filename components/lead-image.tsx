"use client";

import { useState } from "react";
import SmartImage from "@/components/smart-image";

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
      <div className="absolute inset-0 flex items-center justify-center text-ink-500 text-xs uppercase tracking-[0.14em] font-mono">
        Photo unavailable
      </div>
    );
  }
  return (
    <SmartImage
      src={src}
      alt={alt}
      fill
      priority
      sizes="(min-width: 1024px) 66vw, 100vw"
      onError={() => setBroken(true)}
      className="object-cover"
    />
  );
}
