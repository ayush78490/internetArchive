import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Pixelify_Sans } from "next/font/google";
import Link from "next/link";
import { CommandPalette } from "@/components/command-palette";
import { SearchProvider } from "@/components/search-provider";
import { THEME_SCRIPT } from "@/components/theme-toggle";
import { TopBar } from "@/components/top-bar";
import { getNav, getStats } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
/** Display face for headings, labels and entry names. */
const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Internet Archived — every free resource, searchable",
    template: "%s · Internet Archived",
  },
  description:
    "A fast, searchable archive of the FreeMediaHeckYeah wiki: 16,000+ curated free sites, tools and resources across 25 categories.",
  keywords: ["internet archived", "fmhy", "free media", "free tools", "directory", "archive"],
  applicationName: "Internet Archived",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0e" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [nav, stats] = await Promise.all([getNav(), getStats()]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${pixel.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SearchProvider nav={nav}>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
          >
            Skip to content
          </a>
          <TopBar />
          <main id="content" className="flex-1">
            {children}
          </main>
          <footer className="mt-10 px-4 pb-8 sm:px-6">
            <div className="panel mx-auto flex max-w-7xl flex-col gap-3 p-4 text-[12.5px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
              <p>
                A rebuilt interface for the{" "}
                <a
                  href="https://fmhy.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pixel text-ink underline decoration-2 underline-offset-2 hover:text-accent-ink"
                >
                  FMHY
                </a>{" "}
                wiki. Content belongs to its maintainers and contributors.
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <span className="tag">{stats.entries.toLocaleString()} LINKS</span>
                <Link href="/unsafe" className="tag hover:text-danger">
                  UNSAFE SITES
                </Link>
                <span className="tag">
                  SYNCED{" "}
                  {new Date(stats.generated)
                    .toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </span>
              </p>
            </div>
          </footer>
          <CommandPalette />
        </SearchProvider>
      </body>
    </html>
  );
}
