"use client";

import { ArrowRight, Loader2, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryIcon } from "@/lib/icons";
import { useSearch } from "./search-provider";
import { Favicon, Highlight, Tier } from "./ui";

const SUGGESTIONS = ["anime", "vpn", "ebooks", "youtube", "pdf", "emulator", "ai image"];

/**
 * The hero search. Typing swaps the browse grid (passed as children) for
 * live results, so the landing page is a search tool rather than a
 * directory you have to click through.
 */
export function HomeSearch({ children }: { children: React.ReactNode }) {
  const { search, status, load, setPaletteOpen } = useSearch();
  const [query, setQuery] = useState("");
  const [picksOnly, setPicksOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim();
  const hits = useMemo(
    () => (q ? search(q, { picksOnly, limit: 40 }) : []),
    [q, picksOnly, search]
  );

  // Keep "/" and Cmd+K working, but let the hero input own them when focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="relative mx-auto w-full max-w-2xl">
        <div className="field relative items-center">
          <Search
            className="pointer-events-none absolute left-4 size-5 text-ink-faint"
            strokeWidth={2.5}
            aria-hidden
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={load}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hits[0]?.url) {
                window.open(hits[0].url, "_blank", "noopener,noreferrer");
              }
            }}
            placeholder="Search 16,000+ free sites and tools..."
            aria-label="Search all links"
            autoComplete="off"
            spellCheck={false}
            className="py-4 pr-12 pl-12 text-[14px] sm:text-[15px]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-3 grid size-7 place-items-center rounded-lg border-2 border-ink-line bg-card-2 text-ink-soft hover:bg-accent-soft"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : status === "loading" ? (
            <Loader2 className="absolute right-4 size-4 animate-spin text-ink-faint" aria-hidden />
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {q ? (
            <button
              type="button"
              onClick={() => setPicksOnly((v) => !v)}
              aria-pressed={picksOnly}
              className={`btn ${picksOnly ? "btn-on" : ""}`}
            >
              <Sparkles className="size-3.5" aria-hidden />
              TOP PICKS ONLY
            </button>
          ) : (
            <>
              <span className="label mr-1">TRY</span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setQuery(s);
                    inputRef.current?.focus();
                  }}
                  className="btn"
                >
                  {s}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {q ? (
        <section className="mx-auto mt-10 w-full max-w-3xl text-left animate-fade" aria-live="polite">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="pixel text-[13px] text-ink-soft">
              {hits.length ? (
                <>
                  {hits.length === 40 ? "Top 40 matches" : `${hits.length} match${hits.length === 1 ? "" : "es"}`}{" "}
                  for <span className="text-accent-ink">{q}</span>
                </>
              ) : status === "ready" ? (
                <>
                  No matches for <span className="text-accent-ink">{q}</span>
                </>
              ) : (
                "Searching…"
              )}
            </h2>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="label hover:text-accent-ink"
            >
              OPEN IN PALETTE ⌘K
            </button>
          </div>

          <ul className="panel overflow-hidden p-1">
            {hits.map((hit) => (
              <li key={hit.key}>
                <a
                  href={hit.url || `/${hit.category.id}`}
                  target={hit.url ? "_blank" : undefined}
                  rel={hit.url ? "noopener noreferrer nofollow" : undefined}
                  className="row"
                >
                  <Favicon host={hit.host} name={hit.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-1.5">
                      <span className={hit.unsafe ? "row-name-flagged truncate" : "row-name truncate"}>
                        <Highlight text={hit.name} ranges={hit.ranges} />
                      </span>
                      <Tier tier={hit.tier} />
                      {hit.unsafe ? (
                        <span className="tag text-danger">UNSAFE</span>
                      ) : null}
                    </span>
                    <span className="row-desc truncate">{hit.detail || hit.host}</span>
                  </span>
                  <span className="tag hidden shrink-0 items-center gap-1.5 sm:inline-flex">
                    <CategoryIcon name={hit.category?.icon ?? "grid"} className="size-3" />
                    {hit.category?.name}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
                </a>
              </li>
            ))}
          </ul>

          {hits.length ? (
            <p className="mt-3 px-1 text-[12px] text-ink-faint">
              Looking for a whole topic instead?{" "}
              <Link href={`/${hits[0].category.id}`} className="pixel text-accent-ink hover:underline">
                BROWSE {hits[0].category.name.toUpperCase()}
              </Link>
            </p>
          ) : null}
        </section>
      ) : (
        children
      )}
    </>
  );
}
