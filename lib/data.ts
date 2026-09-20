import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { Category, SiteIndex } from "./types";

const DATA = path.join(process.cwd(), "public", "data");

/** Read once per request/render pass rather than per component. */
export const getIndex = cache(async (): Promise<SiteIndex> => {
  const raw = await fs.readFile(path.join(DATA, "index.json"), "utf8");
  return JSON.parse(raw) as SiteIndex;
});

export const getCategory = cache(async (id: string): Promise<Category | null> => {
  // The id becomes a path segment, so reject anything that could escape DATA.
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  try {
    const raw = await fs.readFile(path.join(DATA, "c", `${id}.json`), "utf8");
    return JSON.parse(raw) as Category;
  } catch {
    return null;
  }
});

/**
 * Minimal category/section labels for the client. Search results only need
 * to resolve their numeric category and section indices back to names, so
 * this stays a few KB instead of shipping the whole 75KB index.
 */
export const getNav = cache(async () => {
  const { categories } = await getIndex();
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    count: c.count,
    unsafe: c.unsafe,
    sections: c.sections.map((s) => s.name),
  }));
});

export type NavCategory = Awaited<ReturnType<typeof getNav>>[number];

export const getStats = cache(async () => {
  const { categories, generated } = await getIndex();
  return {
    entries: categories.reduce((a, c) => a + c.count, 0),
    starred: categories.reduce((a, c) => a + c.starred, 0),
    categories: categories.length,
    sections: categories.reduce((a, c) => a + c.sections.length, 0),
    generated,
  };
});
