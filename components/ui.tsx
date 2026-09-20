/**
 * Favicon with a letter fallback behind it. The image sits on top of the
 * initial, so a failed or transparent icon degrades to the letter with no
 * client-side error handling.
 */
export function Favicon({
  host,
  name,
  size = 22,
  className = "",
}: {
  host: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const letter = (name || host || "?").replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "#";
  return (
    <span className={`fav ${className}`} style={{ width: size, height: size }} aria-hidden>
      {letter}
      {host ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://icons.duckduckgo.com/ip3/${host}.ico`}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : null}
    </span>
  );
}

/** Top-pick / recommended marker, drawn as a glyph via CSS. */
export function Tier({ tier, className = "" }: { tier: number; className?: string }) {
  if (!tier) return null;
  return (
    <span
      className={`${tier === 2 ? "tier" : "tier tier-1"} ${className}`}
      title={tier === 2 ? "Top pick" : "Recommended"}
      aria-label={tier === 2 ? "Top pick" : "Recommended"}
    />
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}

/**
 * Highlights matched character ranges returned by uFuzzy. Ranges index into
 * the full haystack, so anything past the name itself is ignored.
 */
export function Highlight({ text, ranges }: { text: string; ranges?: number[] }) {
  if (!ranges?.length) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < ranges.length; i += 2) {
    const start = ranges[i];
    const end = ranges[i + 1];
    if (start >= text.length) break;
    const stop = Math.min(end, text.length);
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className="rounded-[3px] bg-[var(--accent-soft)] text-accent-ink">
        {text.slice(start, stop)}
      </mark>
    );
    cursor = stop;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

/** Renders the inline markdown links FMHY uses inside note text. */
export function NoteText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]*)\]\(([^)\s]+)[^)]*\)|\*\*([^*]+)\*\*/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > cursor) parts.push(text.slice(cursor, m.index));
    if (m[3]) {
      parts.push(
        <strong key={m.index} className="pixel text-ink">
          {m[3]}
        </strong>
      );
    } else {
      parts.push(
        <a
          key={m.index}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-accent-ink underline decoration-2 underline-offset-2"
        >
          {m[1]}
        </a>
      );
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
