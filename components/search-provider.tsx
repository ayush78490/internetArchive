"use client";

import uFuzzy from "@leeoniya/ufuzzy";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SearchRow } from "@/lib/types";

export type NavCategory = {
  id: string;
  name: string;
  icon: string;
  count: number;
  unsafe: boolean;
  sections: string[];
};

export type Hit = {
  key: string;
  name: string;
  url: string;
  host: string;
  detail: string;
  tier: number;
  unsafe: boolean;
  category: NavCategory;
  section: string;
  /** Character ranges to highlight in the name, from uFuzzy. */
  ranges?: number[];
};

type Status = "idle" | "loading" | "ready" | "error";

export type Scope = { id: string; name: string };

type Ctx = {
  nav: NavCategory[];
  status: Status;
  total: number;
  load: () => void;
  search: (q: string, opts?: { category?: string; picksOnly?: boolean; limit?: number }) => Hit[];
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  /** Set by a category page so the palette can search within it. */
  scope: Scope | null;
  setScope: (s: Scope | null) => void;
};

const SearchCtx = createContext<Ctx | null>(null);

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export function SearchProvider({
  nav,
  children,
}: {
  nav: NavCategory[];
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scope, setScope] = useState<Scope | null>(null);
  const rows = useRef<SearchRow[]>([]);
  const haystack = useRef<string[]>([]);
  const hosts = useRef<string[]>([]);
  const started = useRef(false);

  const uf = useMemo(
    () =>
      new uFuzzy({
        // SingleError mode: one typo of slack per term, so "torent" still
        // finds Torrent and "spotifty" still finds Spotify.
        intraMode: 1,
        intraIns: 1,
        intraSub: 1,
        intraTrn: 1,
        intraDel: 1,
        interIns: Infinity,
      }),
    []
  );

  const load = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setStatus("loading");
    fetch("/data/search.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<SearchRow[]>;
      })
      .then((data) => {
        rows.current = data;
        hosts.current = data.map((r) => hostOf(r[1]));
        haystack.current = data.map((r, i) => `${r[0]} ${hosts.current[i]} ${r[2]}`);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  // Warm the index once the page is otherwise idle, so the first keystroke
  // in the palette already has data to work with.
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => load(), { timeout: 3000 });
      return () => (window as unknown as { cancelIdleCallback?: (h: number) => void })
        .cancelIdleCallback?.(id);
    }
    const t = setTimeout(load, 1200);
    return () => clearTimeout(t);
  }, [load]);

  const search = useCallback<Ctx["search"]>(
    (q, opts = {}) => {
      const { category, picksOnly = false, limit = 60 } = opts;
      const data = rows.current;
      if (!data.length) return [];

      const needle = q.trim();
      const catIndex = category ? nav.findIndex((c) => c.id === category) : -1;

      const passes = (r: SearchRow) =>
        (catIndex < 0 || r[3] === catIndex) && (!picksOnly || (r[5] & 3) > 0);

      const build = (i: number, ranges?: number[]): Hit => {
        const r = data[i];
        const cat = nav[r[3]];
        return {
          key: `${i}`,
          name: r[0],
          url: r[1],
          host: hosts.current[i],
          detail: r[2],
          tier: r[5] & 3,
          unsafe: (r[5] & 4) > 0,
          category: cat,
          section: cat?.sections[r[4]] ?? "",
          ranges,
        };
      };

      // Empty query inside a scope: show that scope's best picks.
      if (!needle) {
        const out: Hit[] = [];
        for (let i = 0; i < data.length && out.length < limit; i++) {
          if (passes(data[i]) && (data[i][5] & 3) === 2) out.push(build(i));
        }
        return out;
      }

      const [idxs, info, order] = uf.search(haystack.current, needle, 0, 1e5);
      if (!idxs?.length) return [];

      type Scored = { i: number; score: number; ranges?: number[] };
      const scored: Scored[] = [];
      const lowered = needle.toLowerCase();

      const consider = (i: number, rank: number, ranges?: number[]) => {
        const r = data[i];
        if (!passes(r)) return;
        const name = r[0].toLowerCase();
        let score = rank;
        // Exact and prefix name matches should beat a tag match elsewhere.
        if (name === lowered) score -= 100000;
        else if (name.startsWith(lowered)) score -= 50000;
        else if (hosts.current[i].startsWith(lowered)) score -= 25000;
        else if (name.includes(lowered)) score -= 10000;
        // Curation tier is a gentle tiebreaker, never the primary signal.
        score -= (r[5] & 3) * 2000;
        scored.push({ i, score, ranges });
      };

      if (info && order) {
        for (let k = 0; k < order.length; k++) {
          const infoIdx = order[k];
          consider(info.idx[infoIdx], k, info.ranges[infoIdx]);
        }
      } else {
        for (let k = 0; k < idxs.length; k++) consider(idxs[k], k);
      }

      scored.sort((a, b) => a.score - b.score);
      return scored.slice(0, limit).map((s) => build(s.i, s.ranges));
    },
    [nav, uf]
  );

  const value = useMemo<Ctx>(
    () => ({
      nav,
      status,
      total: nav.reduce((a, c) => a + c.count, 0),
      load,
      search,
      paletteOpen,
      setPaletteOpen,
      scope,
      setScope,
    }),
    [nav, status, load, search, paletteOpen, scope]
  );

  return <SearchCtx.Provider value={value}>{children}</SearchCtx.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchCtx);
  if (!ctx) throw new Error("useSearch must be used inside SearchProvider");
  return ctx;
}
