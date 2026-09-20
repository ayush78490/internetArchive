"use client";

import { Moon, Sun } from "lucide-react";

/** Runs before paint to apply the stored theme without a flash. */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

/**
 * The current theme lives on <html> (set by THEME_SCRIPT before paint), so
 * this button reads it from the DOM on click and swaps icons with CSS. No
 * state means no hydration mismatch and no flash of the wrong icon.
 */
export function ThemeToggle() {
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode: the theme simply resets on reload.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      className="btn px-2"
    >
      <Moon className="hidden size-[17px] dark:block" strokeWidth={2.25} aria-hidden />
      <Sun className="size-[17px] dark:hidden" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
