import { AlertTriangle, ChevronLeft, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryToolbar } from "@/components/category-toolbar";
import { EntryRow } from "@/components/entry-row";
import { SectionNav } from "@/components/section-nav";
import { NoteText } from "@/components/ui";
import { getCategory, getIndex } from "@/lib/data";
import { CategoryIcon } from "@/lib/icons";

export async function generateStaticParams() {
  const { categories } = await getIndex();
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategory(category);
  if (!cat) return { title: "Not found" };
  return {
    title: cat.name,
    description: `${cat.entries.length} curated ${cat.name.toLowerCase()} links from the FMHY wiki — ${cat.sections
      .slice(0, 6)
      .map((s) => s.name)
      .join(", ")}.`,
  };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  const cat = await getCategory(category);
  if (!cat) notFound();

  // Use the same hue this category gets on the home grid, so colour is a
  // consistent identifier rather than decoration.
  const { categories } = await getIndex();
  const position = categories.filter((c) => !c.unsafe).findIndex((c) => c.id === cat.id);
  const hue = cat.unsafe ? 6 : Math.max(0, position) % 8;

  const starred = cat.entries.filter((e) => e.t).length;
  // Group once, then render: avoids a filter pass per subsection.
  const byGroup = new Map<string, typeof cat.entries>();
  for (const e of cat.entries) {
    const key = `${e.s}/${e.b}`;
    const bucket = byGroup.get(key);
    if (bucket) bucket.push(e);
    else byGroup.set(key, [e]);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-[5.5rem] max-h-[calc(100vh-7rem)] overflow-y-auto pt-1">
            <Link href="/" className="btn mb-3 w-full">
              <ChevronLeft className="size-3.5" aria-hidden />
              ALL CATEGORIES
            </Link>
            <SectionNav sections={cat.sections} />
          </div>
        </aside>

        <div className="min-w-0 pt-1">
          <header className="panel mb-3 overflow-hidden" data-hue={hue}>
            <div className="panel-head">
              <CategoryIcon name={cat.icon} className="size-4" />
              <span className="min-w-0 flex-1 truncate text-[15px]">{cat.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-3">
              <span className="tag">{cat.entries.length.toLocaleString()} LINKS</span>
              <span className="tag">{cat.sections.length} SECTIONS</span>
              {starred ? <span className="tag">★ {starred} STARRED</span> : null}
            </div>

            {cat.unsafe ? (
              <div
                className="flex gap-2.5 border-t-[2.5px] border-ink-line p-3 text-[12.5px] leading-relaxed"
                style={{ background: "var(--danger-soft)" }}
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                <p className="text-ink-soft">
                  These sites are flagged by FMHY maintainers for malware, fake download buttons,
                  stolen uploads or aggressive ads.{" "}
                  <span className="pixel text-ink">Avoid them</span> — the reason for each listing
                  is shown alongside it.
                </p>
              </div>
            ) : null}
          </header>

          <CategoryToolbar
            id={cat.id}
            name={cat.name}
            total={cat.entries.length}
            starred={starred}
          />

          <div id="entries" className="mt-3 flex flex-col gap-3">
            {cat.sections.map((section, si) => (
              <section
                key={section.id}
                data-section
                data-hue={(hue + si) % 8}
                className="panel scroll-mt-28 overflow-hidden"
              >
                <h2 id={`s-${section.id}`} className="panel-head scroll-mt-28">
                  <span className="min-w-0 flex-1 truncate">{section.name}</span>
                  <span className="shrink-0 text-[11px] opacity-80">{section.count}</span>
                </h2>

                {section.subsections.map((sub) => {
                  const entries = byGroup.get(`${section.id}/${sub.id}`) ?? [];
                  return (
                    <div key={sub.id} data-group className="border-t-2 border-dashed border-ink-line/25 px-2 py-2.5 first:border-t-0">
                      {sub.name !== section.name ? (
                        <h3 className="label mb-1.5 flex items-center gap-1.5 px-1">
                          {sub.name}
                          <span className="tag">{sub.count}</span>
                        </h3>
                      ) : null}

                      {sub.notes.map((note, i) => (
                        <div
                          key={i}
                          className="mx-1 mb-2 flex gap-2 rounded-lg border-2 border-ink-line p-2.5 text-[12px] leading-relaxed text-ink-soft"
                          style={{
                            background:
                              note.kind === "warning" ? "var(--danger-soft)" : "var(--card-2)",
                          }}
                        >
                          {note.kind === "warning" ? (
                            <AlertTriangle
                              className="mt-0.5 size-3.5 shrink-0 text-danger"
                              aria-hidden
                            />
                          ) : (
                            <Info className="mt-0.5 size-3.5 shrink-0 text-ink-faint" aria-hidden />
                          )}
                          <p>
                            <NoteText text={note.text} />
                          </p>
                        </div>
                      ))}

                      <ul>
                        {entries.map((entry, i) => (
                          <EntryRow key={`${entry.u}-${entry.n}-${i}`} entry={entry} />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
