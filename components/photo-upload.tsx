"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

/** Compress + resize an image file to a JPEG data-URL small enough to store in Postgres */
function compressImage(
  file: File,
  maxPx = 480,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      // Scale down so the longer side is ≤ maxPx
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error("load failed")); };
    img.src = blobUrl;
  });
}

export default function PhotoUpload({
  currentUrl,
  initials,
  onUpload,
  size = "lg",
}: {
  /** Current photo URL (or data-URL) — null shows initials */
  currentUrl: string | null;
  /** 1–2 letter fallback shown when no photo */
  initials: string;
  /** Called with the compressed data-URL when the user picks a file */
  onUpload: (dataUrl: string) => void;
  /** "lg" = 80 px (profile page), "sm" = 48 px (dashboard card) */
  size?: "lg" | "sm";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const dim = size === "lg" ? "h-20 w-20" : "h-12 w-12";
  const text = size === "lg" ? "text-2xl" : "text-base";
  const iconSize = size === "lg" ? 16 : 12;
  const photo = preview ?? currentUrl;

  async function handleFile(file: File) {
    setErr(null);
    if (!file.type.startsWith("image/")) {
      setErr("Please pick an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErr("File is too large (max 10 MB).");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      onUpload(dataUrl);
    } catch {
      setErr("Could not process image — try another file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="relative group">
        {/* Photo / initials circle */}
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt="Photo preview"
            className={`${dim} rounded-2xl object-cover border border-ink-200 flex-shrink-0`}
          />
        ) : (
          <div
            className={`${dim} ${text} rounded-2xl bg-ink-100 text-ink-500 flex items-center justify-center font-display flex-shrink-0 border border-ink-200`}
          >
            {initials}
          </div>
        )}

        {/* Upload overlay button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Upload photo"
        >
          {busy ? (
            <Loader2 size={iconSize + 2} className="text-white animate-spin" />
          ) : (
            <Camera size={iconSize + 2} className="text-white" />
          )}
        </button>

        {/* Remove button */}
        {photo && !busy && (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onUpload("");
            }}
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove photo"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Text button for when photo exists (so it's not just hover-based) */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="text-xs text-ink-500 hover:text-poly-orange transition-colors underline underline-offset-2"
      >
        {busy ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
      </button>

      {err && <p className="text-xs text-red-600">{err}</p>}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
