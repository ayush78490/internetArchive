import { ShieldAlert, Sparkles, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { HomeSearch } from "@/components/home-search";
import { CategoryIcon } from "@/lib/icons";
import { getIndex, getStats } from "@/lib/data";

export default async function HomePage() {
  const [{ categories }, stats] = await Promise.all([getIndex(), getStats()]);
  const browse = categories.filter((c) => !c.unsafe);
  const unsafe = categories.find((c) => c.unsafe);
  /** Scale each category's meter against the largest one. */
  const biggest = Math.max(...browse.map((c) => c.count));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-10 sm:px-6">
      {/* ---- Masthead ---- */}
      <section className="panel overflow-hidden">
        <div className="flex flex-col items-center gap-4 px-5 py-8 text-center sm:py-10">
          <span className="tag flex items-center gap-1.5">
            <Trophy className="size-3.5 text-gold" strokeWidth={2.5} aria-hidden />
            {stats.starred.toLocaleString()} STARRED PICKS
          </span>

          <h1 className="pixel text-4xl leading-[1.05] text-balance sm:text-6xl">
            EVERY FREE RESOURCE
            <br />
            <span className="text-accent-ink">ACTUALLY SEARCHABLE</span>
          </h1>

          <p className="max-w-xl text-[13.5px] leading-relaxed text-ink-soft text-balance">
            {stats.entries.toLocaleString()} hand-curated sites and tools from the FMHY wiki,
            rebuilt with instant fuzzy search across {stats.categories} categories.
          </p>

          <div className="mt-2 w-full">
            <HomeSearch>
              {/* ---- Browse grid ---- */}
              <section className="mt-10 text-left">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 className="pixel text-lg">CHOOSE YOUR CATEGORY</h2>
                  <span className="label">{stats.sections} SECTIONS</span>
                </div>

                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {browse.map((c, i) => (
                    <li key={c.id}>
                      <Link
                        href={`/${c.id}`}
                        data-hue={i % 8}
                        className="panel group flex h-full flex-col transition-transform hover:-translate-y-0.5"
                      >
                        <div className="panel-head">
                          <span className="grid size-5 shrink-0 place-items-center">
                            <CategoryIcon name={c.icon} className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{c.name}</span>
                          <span className="shrink-0 text-[11px] opacity-80">{c.count}</span>
                        </div>

                        <div className="flex flex-1 flex-col gap-2 p-3">
                          <div className="bar">
                            <div
                              className="bar-fill"
                              style={{ width: `${Math.max(8, (c.count / biggest) * 100)}%` }}
                            />
                          </div>
                          <p className="line-clamp-2 text-[11.5px] leading-relaxed text-ink-faint">
                            {c.sections
                              .slice(0, 5)
                              .map((s) => s.name)
                              .join(" · ")}
                          </p>
                          {c.starred > 0 ? (
                            <span className="mt-auto flex items-center gap-1 text-[11px] text-ink-soft">
                              <Star
                                className="size-3 text-gold"
                                fill="currentColor"
                                strokeWidth={0}
                                aria-hidden
                              />
                              {c.starred} starred
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                {unsafe ? (
                  <Link
                    href={`/${unsafe.id}`}
                    className="panel mt-3 flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5"
                    style={{ background: "var(--danger-soft)" }}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border-2 border-ink-line bg-card text-danger">
                      <ShieldAlert className="size-4.5" strokeWidth={2.25} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="pixel block text-[14px] text-ink">SITES TO AVOID</span>
                      <span className="block text-[11.5px] text-ink-soft">
                        {unsafe.count} flagged for malware, fake downloads or shady ads
                      </span>
                    </span>
                    <Sparkles className="size-4 shrink-0 text-danger" aria-hidden />
                  </Link>
                ) : null}
              </section>
            </HomeSearch>
          </div>
        </div>
      </section>
    </div>
  );
}
