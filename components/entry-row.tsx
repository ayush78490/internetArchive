import type { Entry } from "@/lib/types";

/** Related links worth an accent colour instead of the muted default. */
const COMMUNITY = /^(discord|telegram|matrix|subreddit|reddit|forum)$/i;

/**
 * A single wiki entry. Deliberately a server component with no interactive
 * state: a category page renders well over a thousand of these, and keeping
 * them out of the hydration graph is what makes those pages cheap. Classes
 * are hand-written (see globals.css) rather than utility strings because
 * every byte here is multiplied by 1,500 and paid twice — once in the HTML
 * and once in the RSC payload. The data-* attributes let the filter island
 * hide rows straight through the DOM.
 */
export function EntryRow({ entry }: { entry: Entry }) {
  const { n, u, h, t = 0, x, m, a, g, d, l } = entry;
  const flagged = Boolean(x);
  const haystack = [n, h, ...(g ?? []), d ?? "", ...(a ?? []).map((v) => v.n)]
    .join(" ")
    .toLowerCase();
  const letter = (n || h || "#").replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "#";

  return (
    <li
      data-row
      data-tier={t}
      data-name={haystack}
      className={flagged ? "row row-flagged" : "row"}
    >
      {flagged && !u ? (
        <span className="fav fav-flag" style={{ width: 22, height: 22 }} aria-hidden>
          !
        </span>
      ) : (
        <span className="fav" style={{ width: 22, height: 22 }} aria-hidden>
          {letter}
          {h ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://icons.duckduckgo.com/ip3/${h}.ico`}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </span>
      )}

      <div className="row-body">
        <div className="row-head">
          {u ? (
            <a href={u} target="_blank" rel="noopener noreferrer nofollow" className="row-name">
              {n}
            </a>
          ) : (
            <span className="row-name-flagged">{n}</span>
          )}

          {t ? (
            <span
              className={t === 2 ? "tier" : "tier tier-1"}
              title={t === 2 ? "Top pick" : "Recommended"}
            />
          ) : null}

          {/* Mirrors keep the original wiki's [2] [3] shorthand. */}
          {m?.map((url, i) => (
            <a
              key={`${i}-${url}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              title={url}
              className="row-mirror"
            >
              {i + 2}
            </a>
          ))}

          {a?.length ? (
            <span className="row-alts">
              or
              {a.map((alt, i) => (
                <a key={`${i}-${alt.u}`} href={alt.u} target="_blank" rel="noopener noreferrer nofollow">
                  {alt.n}
                </a>
              ))}
            </span>
          ) : null}

          {h ? <span className="row-host">{h}</span> : null}
        </div>

        {g?.length || d || l?.length ? (
          <div className="row-meta">
            {g?.slice(0, 8).map((tag, i) => (
              <span key={`${i}-${tag}`} className="tag">
                {tag}
              </span>
            ))}
            {d ? (
              <span className={flagged ? "row-desc row-desc-flagged" : "row-desc"}>{d}</span>
            ) : null}
            {l?.map((link, i) => (
              <a
                key={`${i}-${link.u}`}
                href={link.u}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={COMMUNITY.test(link.n) ? "row-link row-link-community" : "row-link"}
              >
                {link.n}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
