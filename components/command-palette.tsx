"use client";

import { ArrowUpRight, CornerDownLeft, Loader2, Search, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch, type Hit } from "./search-provider";
import { CategoryIcon } from "@/lib/icons";
import { Favicon, Highlight, Tier } from "./ui";

type Row =
  | { kind: "hit"; hit: Hit }
  | { kind: "category"; id: string; name: string; icon: string; count: number };

/**
 * Owns the global shortcuts and mounts the dialog. Keeping the dialog in a
 * child means every open starts from fresh state without reset effects.
 */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useSearch();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      } else if (e.key === "/" && !typing && !paletteOpen) {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  if (!paletteOpen) return null;
  return <PaletteDialog />;
}

function PaletteDialog() {
  const { search, status, load, nav, setPaletteOpen, scope } = useSearch();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [scoped, setScoped] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeScope = scope && scoped ? scope : undefined;

  useEffect(() => {
    load();
    // Focus after the dialog paints so the caret lands correctly.
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = overflow;
    };
  }, [load]);

  const rows = useMemo<Row[]>(() => {
    const hits = search(query, { category: activeScope?.id, limit: 50 });
    const out: Row[] = hits.map((hit) => ({ kind: "hit", hit }));

    // Let the palette double as category navigation.
    if (query.trim() && !activeScope) {
      const q = query.trim().toLowerCase();
      const cats = nav
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 3)
        .map<Row>((c) => ({
          kind: "category",
          id: c.id,
          name: c.name,
          icon: c.icon,
          count: c.count,
        }));
      out.unshift(...cats);
    }
    return out;
  }, [query, activeScope, search, nav]);

  // Reset the highlight whenever the result set changes, during render
  // rather than in an effect (avoids a second render pass).
  const resultKey = `${query}|${scoped}`;
  const [prevKey, setPrevKey] = useState(resultKey);
  if (resultKey !== prevKey) {
    setPrevKey(resultKey);
    setActive(0);
  }

  const go = useCallback(
    (row: Row) => {
      if (row.kind === "category") {
        router.push(`/${row.id}`);
      } else if (!row.hit.url) {
        router.push(`/${row.hit.category.id}`);
      } else {
        window.open(row.hit.url, "_blank", "noopener,noreferrer");
      }
      setPaletteOpen(false);
    },
    [router, setPaletteOpen]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) {
      e.preventDefault();
      setActive((i) => (rows.length ? (i + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) {
      e.preventDefault();
      setActive((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[active];
      if (row) go(row);
    } else if (e.key === "Backspace" && !query && activeScope) {
      e.preventDefault();
      setScoped(false);
    }
  };

  // Keep the highlighted row visible during keyboard navigation.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] sm:pt-[14vh]">
      <div
        className="absolute inset-0 bg-[var(--paper-deep)]/75 backdrop-blur-sm animate-fade"
        onClick={() => setPaletteOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search all links"
        className="panel relative flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden animate-pop"
      >
        <div className="flex items-center gap-2.5 border-b-[2.5px] border-ink-line px-4">
          <Search className="size-4 shrink-0 text-ink-faint" strokeWidth={2.5} aria-hidden />
          {activeScope ? (
            <span className="pixel shrink-0 rounded-md border-2 border-ink-line bg-accent-soft px-2 py-1 text-[11px] text-accent-ink">
              {activeScope.name}
            </span>
          ) : null}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              activeScope ? `Search in ${activeScope.name}...` : "Search 16,000+ links..."
            }
            className="w-full bg-transparent py-4 font-mono text-[14px] text-ink outline-none placeholder:text-ink-faint"
            autoComplete="off"
            spellCheck={false}
          />
          {status === "loading" ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-ink-faint" aria-hidden />
          ) : null}
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {status === "loading" && !rows.length ? (
            <p className="label py-8 text-center">LOADING THE INDEX…</p>
          ) : status === "error" ? (
            <p className="px-3 py-8 text-center text-sm text-danger">
              Could not load the search index.
            </p>
          ) : !rows.length ? (
            <p className="px-3 py-8 text-center text-[13px] text-ink-soft">
              {query.trim() ? (
                <>
                  No matches for <span className="pixel text-accent-ink">{query}</span>
                </>
              ) : (
                "Start typing to search every link in the wiki."
              )}
            </p>
          ) : (
            <>
              {!query.trim() ? (
                <p className="label px-3 py-2">TOP PICKS</p>
              ) : null}
              {rows.map((row, i) => (
                <button
                  key={row.kind === "hit" ? row.hit.key : `c-${row.id}`}
                  data-idx={i}
                  onClick={() => go(row)}
                  onMouseMove={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-lg border-2 px-2.5 py-2 text-left transition-colors ${
                    i === active ? "border-ink-line bg-accent-soft" : "border-transparent"
                  }`}
                >
                  {row.kind === "category" ? (
                    <>
                      <span className="grid size-[22px] shrink-0 place-items-center rounded-[6px] border-2 border-ink-line bg-accent-soft text-accent-ink">
                        <CategoryIcon name={row.icon} className="size-3.5" />
                      </span>
                      <span className="pixel min-w-0 flex-1 truncate text-[13px] text-ink">
                        BROWSE {row.name.toUpperCase()}
                      </span>
                      <span className="tag shrink-0">{row.count}</span>
                    </>
                  ) : (
                    <>
                      {row.hit.unsafe && !row.hit.url ? (
                        <span className="fav fav-flag size-[22px]">
                          <ShieldAlert className="size-3.5" aria-hidden />
                        </span>
                      ) : (
                        <Favicon host={row.hit.host} name={row.hit.name} />
                      )}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`truncate ${
                              row.hit.unsafe ? "row-name-flagged" : "row-name"
                            }`}
                          >
                            <Highlight text={row.hit.name} ranges={row.hit.ranges} />
                          </span>
                          <Tier tier={row.hit.tier} />
                        </span>
                        <span className="row-desc truncate">
                          {row.hit.detail || row.hit.host}
                        </span>
                      </span>
                      <span className="tag hidden shrink-0 items-center gap-1.5 sm:inline-flex">
                        <CategoryIcon name={row.hit.category?.icon ?? "grid"} className="size-3" />
                        {row.hit.category?.name}
                      </span>
                      {i === active ? (
                        <ArrowUpRight className="size-3.5 shrink-0 text-accent-ink" aria-hidden />
                      ) : null}
                    </>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="label flex items-center justify-between border-t-[2.5px] border-ink-line px-3 py-2">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Key>↑</Key>
              <Key>↓</Key>
              NAVIGATE
            </span>
            <span className="inline-flex items-center gap-1">
              <Key>
                <CornerDownLeft className="size-3" />
              </Key>
              OPEN
            </span>
            {activeScope ? (
              <span className="hidden items-center gap-1 sm:inline-flex">
                <Key>⌫</Key>
                SEARCH ALL
              </span>
            ) : null}
          </span>
          <span className="flex items-center gap-1.5">
            <Key>ESC</Key> CLOSE
          </span>
        </div>
      </div>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="kbd">{children}</kbd>
  );
}
