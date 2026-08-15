import Image, { type ImageProps } from "next/image";

const OPTIMIZABLE_HOSTS = new Set([
  "i.pravatar.cc",
  "images.unsplash.com",
  "cmsv2-assets.apptegy.net",
]);

function isOptimizable(src: string): boolean {
  if (src.startsWith("data:")) return false;
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

/**
 * Wraps next/image for fields that store an arbitrary officer-pasted URL (base64
 * data-URL or any https URL) rather than a fixed, known-good source. next/image
 * throws at request time for hostnames outside next.config.js's remotePatterns, so
 * anything not on the optimizable allowlist falls back to `unoptimized` instead of
 * crashing — it still gets next/image's lazy-loading and CLS-safe sizing, just no
 * resize/format conversion.
 */
export default function SmartImage({ src, ...props }: ImageProps) {
  return <Image src={src} unoptimized={!isOptimizable(src as string)} {...props} />;
}
