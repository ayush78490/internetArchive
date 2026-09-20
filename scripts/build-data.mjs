/**
 * Builds the static data layer from the upstream FMHY markdown wiki.
 *
 *   node scripts/build-data.mjs [--refresh]
 *
 * Markdown is cached in .cache/ so builds are offline-repeatable; pass
 * --refresh to re-pull from GitHub. Output lands in public/data/.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const CACHE = path.join(ROOT, ".cache");
const OUT = path.join(ROOT, "public", "data");
const REPO = "https://raw.githubusercontent.com/fmhy/edit/main/docs";
const API = "https://api.github.com/repos/fmhy/edit/contents/docs";

/** Display metadata per source file. Order drives the nav. */
const CATEGORIES = [
  ["video", "Movies & TV", "clapperboard"],
  ["audio", "Music & Audio", "music"],
  ["gaming", "Gaming", "gamepad"],
  ["reading", "Books & Reading", "book"],
  ["educational", "Learning", "graduation"],
  ["ai", "AI Tools", "sparkles"],
  ["downloading", "Downloading", "download"],
  ["torrenting", "Torrenting", "magnet"],
  ["mobile", "Android & iOS", "phone"],
  ["linux-macos", "Linux & macOS", "terminal"],
  ["system-tools", "System Tools", "cpu"],
  ["file-tools", "File Tools", "folder"],
  ["internet-tools", "Internet Tools", "globe"],
  ["social-media-tools", "Social Media", "chat"],
  ["text-tools", "Text Tools", "type"],
  ["video-tools", "Video Tools", "film"],
  ["image-tools", "Image Tools", "image"],
  ["developer-tools", "Developer Tools", "code"],
  ["gaming-tools", "Gaming Tools", "joystick"],
  ["privacy", "Privacy & Security", "shield"],
  ["storage", "Storage", "database"],
  ["non-english", "Non-English", "languages"],
  ["misc", "Miscellaneous", "grid"],
  ["beginners-guide", "Beginners Guide", "compass"],
  ["unsafe", "Unsafe Sites", "warning"],
];
const META = new Map(CATEGORIES.map(([id, name, icon]) => [id, { name, icon }]));
/** Files that are navigation/meta rather than link collections. */
const SKIP = new Set(["index", "feedback", "posts", "sandbox", "startpage", "single-page"]);

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "section";

/** Heading glyphs FMHY uses as bullets; they carry no meaning for us. */
const stripGlyphs = (s) => s.replace(/[►▷▶◄]/g, "").replace(/\s+/g, " ").trim();

async function load(refresh) {
  await fs.mkdir(CACHE, { recursive: true });
  let files = (await fs.readdir(CACHE)).filter((f) => f.endsWith(".md"));

  if (refresh || files.length === 0) {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`GitHub listing failed: ${res.status}`);
    const listing = await res.json();
    const names = listing
      .filter((f) => f.type === "file" && f.name.endsWith(".md"))
      .map((f) => f.name);
    await Promise.all(
      names.map(async (name) => {
        const r = await fetch(`${REPO}/${name}`);
        if (!r.ok) throw new Error(`fetch ${name}: ${r.status}`);
        await fs.writeFile(path.join(CACHE, name), await r.text());
      })
    );
    console.log(`> pulled ${names.length} files from upstream`);
    files = names;
  } else {
    console.log(`> using ${files.length} cached files (--refresh to re-pull)`);
  }
  return files.filter((f) => !SKIP.has(f.replace(/\.md$/, "")));
}

/**
 * Splits "Name links - description" on the first top-level " - ",
 * ignoring separators that sit inside [] or () so URLs stay intact.
 */
function splitOnDash(line) {
  let square = 0;
  let round = 0;
  for (let i = 0; i < line.length - 2; i++) {
    const c = line[i];
    if (c === "[") square++;
    else if (c === "]") square--;
    else if (c === "(") round++;
    else if (c === ")") round--;
    else if (
      square === 0 &&
      round === 0 &&
      c === " " &&
      (line[i + 1] === "-" || line[i + 1] === "–" || line[i + 1] === "—") &&
      line[i + 2] === " "
    ) {
      return [line.slice(0, i), line.slice(i + 3)];
    }
  }
  return [line, ""];
}

const LINK = /\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g;

function extractLinks(text) {
  const out = [];
  for (const m of text.matchAll(LINK)) {
    out.push({ label: stripGlyphs(m[1].replace(/\*\*/g, "")), url: m[2] });
  }
  return out;
}

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** Short slash-delimited fragments read as feature tags; prose does not. */
function splitTags(desc) {
  const clean = desc.replace(LINK, "").replace(/\*\*/g, "").trim();
  if (!clean) return { tags: [], text: "" };
  const parts = clean
    .split("/")
    .map((p) => p.replace(/^[\s,-]+|[\s,-]+$/g, ""))
    .filter(Boolean);
  const tagish =
    parts.length > 0 &&
    parts.every((p) => p.length <= 24 && !/[.!?;:]/.test(p) && p.split(/\s+/).length <= 4);
  if (tagish) return { tags: parts, text: "" };
  // Rejoin from the filtered parts so separators left behind by stripped
  // links ("Sign-Up / / / ") do not survive into the description.
  return { tags: [], text: parts.join(" / ") };
}

function parseFile(name, md) {
  const id = name.replace(/\.md$/, "");
  const meta = META.get(id) ?? { name: stripGlyphs(id.replace(/-/g, " ")), icon: "grid" };
  const unsafe = id === "unsafe";

  const sections = [];
  let section = null;
  let sub = null;
  const entries = [];

  const pushSection = (title) => {
    section = { id: slug(title), name: title, subsections: [] };
    sections.push(section);
    sub = null;
  };
  const pushSub = (title) => {
    if (!section) pushSection(meta.name);
    sub = { id: slug(title), name: title, notes: [] };
    section.subsections.push(sub);
  };

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line || /^\*{3,}$/.test(line) || /^-{3,}$/.test(line)) continue;

    const h2 = /^##+\s+(.*)$/.exec(line);
    const h1 = /^#\s+(.*)$/.exec(line);
    if (h2) {
      pushSub(stripGlyphs(h2[1]));
      continue;
    }
    if (h1) {
      pushSection(stripGlyphs(h1[1]));
      continue;
    }

    const bullet = /^(\s*)[*-]\s+(.*)$/.exec(line);
    if (!bullet) continue;
    let body = bullet[2].trim();
    // The unsafe list names sites in plain text, so it has no link to require.
    if (!unsafe && !/\[[^\]]*\]\(https?:/i.test(body)) continue;
    if (/Back to Wiki Index/i.test(body)) continue;

    if (!section) pushSection(meta.name);
    if (!sub) pushSub(section.name);

    // Leading emoji marks curation tier: star-struck = top pick, star = recommended.
    let tier = 0;
    const star = /^([\u{1F31F}⭐⚠️\s]+)/u.exec(body);
    if (star) {
      if (star[1].includes("\u{1F31F}")) tier = 2;
      else if (star[1].includes("⭐")) tier = 1;
      body = body.slice(star[1].length).trim();
    }

    const [head, tail] = splitOnDash(body);

    // A note/warning row describes the section rather than a single site.
    const bare = head.replace(/\*\*/g, "").replace(LINK, "").trim();
    if (/^(note|warning|info|tip)s?$/i.test(bare) && tail) {
      sub.notes.push({ kind: /warning/i.test(bare) ? "warning" : "note", text: tail });
      continue;
    }

    const headLinks = extractLinks(head);
    if (headLinks.length === 0 && !unsafe) continue;

    // Flagged sites are listed by name only; keep the name and the reason.
    if (headLinks.length === 0) {
      const label = head.replace(/\*\*/g, "").replace(/^[^\w(]+/, "").trim();
      if (!label || !tail) continue;
      entries.push({
        n: label,
        u: "",
        h: "",
        s: section.id,
        b: sub.id,
        x: 1,
        d: tail.replace(LINK, (_m, t) => t).replace(/\*\*/g, "").replace(/\s+/g, " ").trim(),
      });
      continue;
    }

    const primary = headLinks[0];
    const mirrors = [];
    const alts = [];
    for (const l of headLinks.slice(1)) {
      if (/^\d+$/.test(l.label)) mirrors.push(l.url);
      else alts.push(l);
    }

    const { tags, text } = splitTags(tail);
    const extras = extractLinks(tail).filter((l) => !/^\d+$/.test(l.label));

    entries.push({
      n: primary.label || hostOf(primary.url),
      u: primary.url,
      h: hostOf(primary.url),
      s: section.id,
      b: sub.id,
      ...(tier ? { t: tier } : {}),
      ...(unsafe ? { x: 1 } : {}),
      ...(mirrors.length ? { m: mirrors } : {}),
      ...(alts.length ? { a: alts.map((l) => ({ n: l.label, u: l.url })) } : {}),
      ...(tags.length ? { g: tags } : {}),
      ...(text ? { d: text } : {}),
      ...(extras.length ? { l: extras.map((l) => ({ n: l.label, u: l.url })) } : {}),
    });
  }

  // Drop headings that ended up holding nothing.
  const counts = new Map();
  for (const e of entries) {
    const k = `${e.s}/${e.b}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  for (const s of sections) {
    s.subsections = s.subsections.filter(
      (b) => counts.has(`${s.id}/${b.id}`) || b.notes.length > 0
    );
    for (const b of s.subsections) b.count = counts.get(`${s.id}/${b.id}`) ?? 0;
    s.count = s.subsections.reduce((a, b) => a + b.count, 0);
  }

  return {
    id,
    name: meta.name,
    icon: meta.icon,
    unsafe,
    sections: sections.filter((s) => s.subsections.length > 0),
    entries,
  };
}

async function main() {
  const refresh = process.argv.includes("--refresh");
  const files = await load(refresh);

  const cats = [];
  const merged = new Map(); // several files can share one display category
  for (const f of files.sort()) {
    const parsed = parseFile(f, await fs.readFile(path.join(CACHE, f), "utf8"));
    if (parsed.entries.length === 0) continue;
    const existing = merged.get(parsed.name);
    if (existing) {
      existing.sections.push(...parsed.sections);
      existing.entries.push(...parsed.entries);
    } else {
      merged.set(parsed.name, parsed);
      cats.push(parsed);
    }
  }
  // Honour the display order declared in CATEGORIES.
  const order = CATEGORIES.map(([, n]) => n);
  cats.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(path.join(OUT, "c"), { recursive: true });

  const index = [];
  const search = [];
  for (const [ci, c] of cats.entries()) {
    await fs.writeFile(
      path.join(OUT, "c", `${c.id}.json`),
      JSON.stringify({
        id: c.id,
        name: c.name,
        icon: c.icon,
        unsafe: c.unsafe,
        sections: c.sections,
        entries: c.entries,
      })
    );
    index.push({
      id: c.id,
      name: c.name,
      icon: c.icon,
      unsafe: c.unsafe,
      count: c.entries.length,
      starred: c.entries.filter((e) => e.t).length,
      sections: c.sections.map((s) => ({
        id: s.id,
        name: s.name,
        count: s.count,
        subsections: s.subsections.map((b) => ({ id: b.id, name: b.name, count: b.count })),
      })),
    });
    // Tuples, category/section as indices, host derived from the URL at
    // runtime: the lazily-fetched search payload stays a fraction of the
    // full category data.
    const sectionIds = c.sections.map((s) => s.id);
    for (const e of c.entries) {
      const hay = ((e.g ?? []).join(" ") + (e.d ? " " + e.d : "")).trim();
      search.push([
        e.n,
        e.u,
        hay.length > 90 ? hay.slice(0, 90) : hay,
        ci,
        sectionIds.indexOf(e.s),
        (e.t ?? 0) | (e.x ? 4 : 0),
      ]);
    }
  }

  await fs.writeFile(
    path.join(OUT, "index.json"),
    JSON.stringify({ categories: index, generated: new Date().toISOString() })
  );
  await fs.writeFile(path.join(OUT, "search.json"), JSON.stringify(search));

  const kb = async (p) => ((await fs.stat(path.join(OUT, p))).size / 1024).toFixed(0) + "KB";
  console.log(`> ${cats.length} categories, ${search.length} entries`);
  console.log(`  index.json ${await kb("index.json")} - search.json ${await kb("search.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
