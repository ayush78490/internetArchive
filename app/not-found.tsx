import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel mx-auto my-16 flex max-w-md flex-col items-center px-6 py-12 text-center">
      <p className="pixel text-5xl text-accent-ink">404</p>
      <h1 className="pixel mt-3 text-xl">GAME OVER</h1>
      <p className="mt-2 text-[13px] text-ink-soft">
        That page is not in the index. Try searching instead — press{" "}
        <span className="kbd">⌘K</span>.
      </p>
      <Link
        href="/"
        className="btn btn-on mt-6"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        BACK TO ALL CATEGORIES
      </Link>
    </div>
  );
}
