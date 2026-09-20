# Internet Archived

A rebuilt, search-first archive of the [FMHY](https://fmhy.net/) wiki — **16,382 curated
links** across 25 categories, with instant fuzzy search over the entire dataset.

The upstream wiki is a set of markdown files rendered as long scrolling pages. This project
keeps the same content but treats it as structured data: every entry is parsed into a record
with mirrors, alternates, feature tags and related links, so the whole index becomes
searchable and filterable instead of something you scroll through with Ctrl+F.

## Getting started

```bash
npm install
npm run dev
```

The first `npm run dev` needs `public/data` to exist. Generate it with:

```bash
npm run data
```

`npm run build` does this automatically via `prebuild`.

## How it works

### Data layer — `scripts/build-data.mjs`

Pulls the 27 markdown files from [`fmhy/edit`](https://github.com/fmhy/edit), caches them in
`.cache/`, and parses them into JSON. There is no database; the entire site is static files.

The wiki's markdown is consistent enough to parse structurally:

```
* 🌟 **[Rive](https://rivestream.app/)**, [2](https://rivestream.ru/) or [CorsFlix](...) - Movies / TV / 4K / [Discord](...)
```

becomes:

```json
{
  "n": "Rive", "u": "https://rivestream.app/", "h": "rivestream.app", "t": 2,
  "m": ["https://rivestream.ru/"],
  "a": [{ "n": "CorsFlix", "u": "https://watch.corsflix.net" }],
  "g": ["Movies", "TV", "4K"],
  "l": [{ "n": "Discord", "u": "https://discord.gg/..." }]
}
```

Notable parsing details:

- **Title/description split** happens on the first ` - ` at bracket depth zero, so URLs and
  link labels containing dashes stay intact.
- **Tags vs prose** — slash-delimited descriptions made of short fragments become filterable
  tag chips; full sentences stay as prose.
- **Curation tiers** — 🌟 (top pick) and ⭐ (recommended) become a sortable rank that feeds
  search ranking and the "Top picks" filter.
- **`unsafe.md`** lists flagged sites by name with no URL. These are parsed separately, with
  the reason preserved, and surfaced in red wherever they appear.

Output:

| File | Size | Purpose |
| --- | --- | --- |
| `public/data/index.json` | 75 KB | Category/section tree, counts |
| `public/data/c/<id>.json` | 4–180 KB | Full entries, one file per category |
| `public/data/search.json` | 1.3 MB (395 KB gzip) | Compact tuples for client-side search |

Refresh from upstream with `npm run data:refresh`.

### Search

`search.json` is a tuple array (`[name, url, haystack, categoryIdx, sectionIdx, flags]`) rather
than objects — field names repeated 16,000 times are the single biggest cost in a payload like
this. Host names are derived from URLs at runtime instead of being stored.

Matching uses [uFuzzy](https://github.com/leeoniya/uFuzzy) in SingleError mode, so one typo per
term still matches ("torent" → Torrent). uFuzzy's ranking is then adjusted: exact name matches,
prefix matches and host matches are boosted ahead of matches that only hit a tag, with curation
tier as a gentle tiebreaker.

The index is fetched lazily on `requestIdleCallback` (or on first focus/hover of any search
input), so it never blocks first paint.

### Rendering strategy

Every page is statically generated. The performance-sensitive part is the category pages: the
largest holds 1,543 entries.

- Entry rows are **server components with no interactive state**, so none of them are hydrated.
- The filter input is a small client island that hides rows by toggling `data-*` attributes on
  the existing DOM nodes, with CSS doing the hiding. Filtering 1,500 rows is a single loop and
  zero React re-renders.
- Row markup uses hand-written CSS classes rather than utility strings. Class strings are paid
  for twice on an RSC page (once in the HTML, once in the flight payload); moving them to
  `globals.css` cut the largest page from 6.45 MB to 3.01 MB.

### UI

- `⌘K` / `Ctrl+K` (or `/`) opens the command palette from anywhere. On a category page it scopes
  to that category automatically; Backspace on an empty query widens it back to everything.
- The home page is a search box first and a directory second — typing replaces the category grid
  with live results.
- Light and dark themes, applied before first paint by an inline script so there is no flash.
- Favicons come from DuckDuckGo's icon service with a letter fallback rendered underneath, so a
  failed icon needs no client-side error handling.

## Project structure

```
app/
  layout.tsx           Shell, providers, theme script
  page.tsx             Home (hero search + category grid)
  [category]/page.tsx  Static category pages (SSG)
  globals.css          Theme tokens + entry-row component CSS
components/
  search-provider.tsx  Lazy index loading, uFuzzy, ranking, palette state
  command-palette.tsx  ⌘K dialog
  home-search.tsx      Hero search island
  category-toolbar.tsx DOM-level filter island
  entry-row.tsx        Static server-rendered row
  section-nav.tsx      Scroll-spy sidebar
lib/
  data.ts              Server-side JSON loaders
  types.ts             Shared data shapes
scripts/
  build-data.mjs       Markdown → JSON pipeline
```

## Notes

Content belongs to the FMHY maintainers and contributors; this is only a different front end
for it. The parser reads the upstream repository directly, so a refresh picks up their edits
without any manual work here.
