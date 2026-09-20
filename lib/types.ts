/**
 * Shapes emitted by scripts/build-data.mjs. Field names are terse because
 * every one of them is repeated across 16k entries in the shipped JSON.
 */

export type Link = { n: string; u: string };

export type Entry = {
  /** name */ n: string;
  /** url ("" for flagged sites listed by name only) */ u: string;
  /** host */ h: string;
  /** section id */ s: string;
  /** subsection id */ b: string;
  /** tier: 2 = top pick, 1 = recommended */ t?: number;
  /** flagged unsafe */ x?: number;
  /** mirror urls */ m?: string[];
  /** alternative sites sharing the row */ a?: Link[];
  /** feature tags */ g?: string[];
  /** prose description */ d?: string;
  /** related links (Discord, guides, ...) */ l?: Link[];
};

export type Note = { kind: "note" | "warning"; text: string };

export type Subsection = {
  id: string;
  name: string;
  count: number;
  notes: Note[];
};

export type Section = {
  id: string;
  name: string;
  count: number;
  subsections: Subsection[];
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  unsafe: boolean;
  sections: Section[];
  entries: Entry[];
};

export type CategorySummary = {
  id: string;
  name: string;
  icon: string;
  unsafe: boolean;
  count: number;
  starred: number;
  sections: {
    id: string;
    name: string;
    count: number;
    subsections: { id: string; name: string; count: number }[];
  }[];
};

export type SiteIndex = {
  categories: CategorySummary[];
  generated: string;
};

/**
 * Compact search record: [name, url, haystack, categoryIndex, sectionIndex, flags].
 * flags: bit 0-1 = tier, bit 2 = unsafe.
 */
export type SearchRow = [string, string, string, number, number, number];
