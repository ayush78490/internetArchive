/**
 * Brand mark: a blocky pixel "A" on an outlined tile. Drawn on a 16x16 grid
 * with whole-pixel rects so it stays crisp at any size, and outlined in the
 * same ink as the rest of the UI. Keep in sync with app/icon.svg.
 */
export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} role="img" aria-label="Internet Archived">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="3" className="fill-[#d4c4f7]" />
      {/* Pixel A: legs, apex and crossbar, each a whole grid cell. */}
      <g className="fill-[#332e4a]">
        <rect x="6" y="3" width="4" height="2" />
        <rect x="4" y="5" width="2" height="2" />
        <rect x="10" y="5" width="2" height="2" />
        <rect x="4" y="7" width="8" height="2" />
        <rect x="4" y="9" width="2" height="4" />
        <rect x="10" y="9" width="2" height="4" />
      </g>
      <rect
        x="0.75"
        y="0.75"
        width="14.5"
        height="14.5"
        rx="3"
        fill="none"
        stroke="#332e4a"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Mark plus wordmark, with the second word carrying the accent. */
export function Wordmark() {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <Logo className="size-8" />
      <span className="pixel hidden text-[17px] leading-none whitespace-nowrap sm:block">
        INTERNET <span className="text-accent-ink">ARCHIVED</span>
      </span>
    </span>
  );
}
