"use client";

import { useState } from "react";
import { Instagram, Mail, Check } from "lucide-react";

export default function ContactStrip({
  schoolEmail,
  instagram,
}: {
  schoolEmail: string | null;
  instagram: string | null;
}) {
  const [copied, setCopied] = useState<"email" | "instagram" | null>(null);

  async function copy(value: string, which: "email" | "instagram") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1800);
    } catch {
      // Clipboard rejected (insecure context, permissions). Silent fail —
      // the underlying mailto:/instagram link below still works.
    }
  }

  if (!schoolEmail && !instagram) return null;

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 pt-6 border-t border-ink-200">
      {schoolEmail && (
        <ContactRow
          href={`mailto:${schoolEmail}`}
          onCopy={() => copy(schoolEmail, "email")}
          icon={<Mail size={14} />}
          label={schoolEmail}
          copied={copied === "email"}
        />
      )}
      {instagram && (
        <ContactRow
          href={`https://instagram.com/${instagram}`}
          external
          onCopy={() => copy(`@${instagram}`, "instagram")}
          icon={<Instagram size={14} />}
          label={`@${instagram}`}
          copied={copied === "instagram"}
        />
      )}
    </div>
  );
}

function ContactRow({
  href,
  external,
  onCopy,
  icon,
  label,
  copied,
}: {
  href: string;
  external?: boolean;
  onCopy: () => void;
  icon: React.ReactNode;
  label: string;
  copied: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 group">
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="inline-flex items-center gap-2 text-sm text-ink-700 hover:text-poly-navyDark transition-colors"
      >
        <span className="text-ink-400 group-hover:text-poly-navyDark transition-colors">
          {icon}
        </span>
        <span className="font-mono text-xs">{label}</span>
      </a>
      <button
        type="button"
        onClick={onCopy}
        className="text-[10px] uppercase tracking-[0.12em] text-ink-400 hover:text-poly-navy transition-colors min-w-[3rem] text-left"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <span className="inline-flex items-center gap-1 text-poly-green">
            <Check size={10} strokeWidth={3} />
            Copied
          </span>
        ) : (
          "Copy"
        )}
      </button>
    </div>
  );
}
