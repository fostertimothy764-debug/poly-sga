/**
 * Renders an announcement body with a small slice of editorial structure:
 *   - Paragraphs are split on blank lines.
 *   - Any paragraph whose first line begins with "> " renders as a pull-quote
 *     in Fraunces italic with a hairline left rule. (Officers can drop a quote
 *     into a body just by prefixing a line with "> ".)
 *   - Everything else flows as ordinary body type.
 *
 * Deliberately no Markdown library — the surface area is intentionally tiny
 * and the parsing rules are visible at a glance.
 */
export default function RichBody({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => {
        if (p.startsWith("> ")) {
          const quote = p
            .split("\n")
            .map((line) => line.replace(/^>\s?/, ""))
            .join("\n");
          return (
            <blockquote
              key={i}
              className="border-l-2 border-poly-navy/40 pl-5 py-1 my-2 font-display text-xl sm:text-2xl italic font-light leading-snug text-ink-800 whitespace-pre-line"
            >
              {quote}
            </blockquote>
          );
        }
        return (
          <p
            key={i}
            className="text-ink-700 leading-relaxed whitespace-pre-line"
          >
            {p}
          </p>
        );
      })}
    </div>
  );
}
