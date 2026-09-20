"use client";

import { Search, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearch } from "./search-provider";

/**
 * Filters the category listing by toggling data-attributes on the static
 * server-rendered rows rather than re-rendering them in React. A large
 * category is 1500+ rows; this keeps filtering instant and keeps those rows
 * out of the hydration graph entirely.
 */
export function CategoryToolbar({
  id,
  name,
  total,
  starred,
}: {
  id: string;
  name: string;
  total: number;
  starred: number;
}) {
  const [query, setQuery] = useState("");
  const [picksOnly, setPicksOnly] = useState(false);
  const [shown, setShown] = useState(total);
  const { setScope } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  // Let the global palette search inside this category while we are here.
  useEffect(() => {
    setScope({ id, name });
    return () => setScope(null);
  }, [id, name, setScope]);

  const apply = useCallback((q: string, picks: boolean) => {
    const root = document.getElementById("entries");
    if (!root) return;
    const needle = q.trim().toLowerCase();
    let visible = 0;

    for (const group of root.querySelectorAll<HTMLElement>("[data-group]")) {
      let groupCount = 0;
      for (const row of group.querySelectorAll<HTMLElement>("[data-row]")) {
        const okPicks = !picks || row.dataset.tier !== "0";
        const okText = !needle || (row.dataset.name ?? "").includes(needle);
        const show = okPicks && okText;
        if (show) {
          row.removeAttribute("data-row-hidden");
          groupCount++;
        } else {
          row.setAttribute("data-row-hidden", "1");
        }
      }
      group.toggleAttribute("data-group-hidden", groupCount === 0);
      visible += groupCount;
    }

    // A section disappears once every subsection inside it is empty.
    for (const section of root.querySelectorAll<HTMLElement>("[data-section]")) {
      const anyVisible = section.querySelector("[data-group]:not([data-group-hidden])");
      section.toggleAttribute("data-group-hidden", !anyVisible);
    }

    setShown(visible);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => apply(query, picksOnly), query ? 90 : 0);
    return () => clearTimeout(t);
  }, [query, picksOnly, apply]);

  // Leaving the page must not strand the list in a filtered state.
  useEffect(() => () => apply("", false), [apply]);

  return (
    <div className="panel sticky top-[4.75rem] z-30 p-2">
      <div className="flex items-center gap-2">
        <div className="field relative min-w-0 flex-1 items-center !shadow-none">
          <Search
            className="pointer-events-none absolute left-3 size-4 text-ink-faint"
            strokeWidth={2.5}
            aria-hidden
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder={`Filter ${total.toLocaleString()} links in ${name}...`}
            aria-label={`Filter links in ${name}`}
            autoComplete="off"
            spellCheck={false}
            className="h-9 pr-8 pl-9 text-[12.5px]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear filter"
              className="absolute right-2 grid size-6 place-items-center rounded text-ink-faint hover:text-ink"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        {starred > 0 ? (
          <button
            type="button"
            onClick={() => setPicksOnly((v) => !v)}
            aria-pressed={picksOnly}
            className={`btn h-9 shrink-0 ${picksOnly ? "btn-on" : ""}`}
          >
            <Sparkles className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">TOP PICKS</span>
            <span className="text-[11px] opacity-75">{starred}</span>
          </button>
        ) : null}
      </div>

      {shown !== total ? (
        <p className="label mt-2 px-1" aria-live="polite">
          {shown.toLocaleString()} OF {total.toLocaleString()} SHOWN
          {shown === 0 ? " — TRY A DIFFERENT TERM" : ""}
        </p>
      ) : null}
    </div>
  );
}
