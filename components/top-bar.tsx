"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "@/lib/icons";
import { Wordmark } from "./logo";
import { useSearch } from "./search-provider";
import { ThemeToggle } from "./theme-toggle";

/** lucide dropped brand marks, so the GitHub glyph is inlined. */
function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-[17px] fill-current" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function TopBar() {
  const { nav, setPaletteOpen, load } = useSearch();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 pb-2 sm:px-6">
      <div className="panel mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-3">
        <Link href="/" className="shrink-0" aria-label="Internet Archived home">
          <Wordmark />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-haspopup="menu"
            className="btn"
          >
            BROWSE
            <ChevronDown
              className={`size-3.5 transition-transform ${menu ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {menu ? (
            <div
              role="menu"
              className="panel absolute top-full left-0 mt-2 grid max-h-[70vh] w-[min(88vw,34rem)] grid-cols-1 gap-1 overflow-y-auto p-2 animate-pop sm:grid-cols-2"
            >
              {nav.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/${c.id}`}
                  role="menuitem"
                  onClick={() => setMenu(false)}
                  data-hue={i % 8}
                  className="flex items-center gap-2.5 rounded-lg border-2 border-transparent px-2 py-1.5 text-sm transition-colors hover:border-ink-line hover:bg-card-2"
                >
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-md border-2 border-ink-line text-[#24203a]"
                    style={{ background: c.unsafe ? "var(--danger-soft)" : "var(--hue)" }}
                  >
                    <CategoryIcon name={c.icon} className="size-3.5" />
                  </span>
                  <span className="pixel min-w-0 flex-1 truncate text-[13px] text-ink">
                    {c.name}
                  </span>
                  <span className="tag shrink-0">{c.count}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          onMouseEnter={load}
          className="btn min-w-0 flex-1 justify-start sm:max-w-md"
        >
          <Search className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
          <span className="truncate">SEARCH LINKS...</span>
          <span className="kbd ml-auto hidden sm:inline-flex">⌘K</span>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <ThemeToggle />
          <a
            href="https://github.com/fmhy/edit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source wiki on GitHub"
            className="btn px-2"
          >
            <GithubMark />
          </a>
        </div>
      </div>
    </header>
  );
}
