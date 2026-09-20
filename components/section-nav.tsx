"use client";

import { useEffect, useState } from "react";
import type { Section } from "@/lib/types";

/** Sticky in-page navigation with scroll-spy over the section headings. */
export function SectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const headings = sections
      .map((s) => document.getElementById(`s-${s.id}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // The topmost heading currently inside the reading band wins.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.slice(2));
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Sections" className="panel flex flex-col gap-0.5 p-2">
      <p className="label px-1 pb-1.5">ON THIS PAGE</p>
      {sections.map((s) => {
        const on = active === s.id;
        return (
          <a
            key={s.id}
            href={`#s-${s.id}`}
            aria-current={on ? "true" : undefined}
            className={`flex items-center gap-2 rounded-lg border-2 px-2 py-1.5 text-[12px] transition-colors ${
              on
                ? "border-ink-line bg-accent-soft text-accent-ink"
                : "border-transparent text-ink-soft hover:border-ink-line hover:bg-card-2"
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            <span className="shrink-0 font-mono text-[10px] text-ink-faint">{s.count}</span>
          </a>
        );
      })}
    </nav>
  );
}
