import Link from "next/link";
import GithubIcon from "@/components/icons/GithubIcon";
import { APP, REPO_URL } from "@/lib/constants";

export default function Nav() {
  return (
    <header className="bg-[color:var(--color-canvas)]/70 sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_4px_18px_-4px_rgba(139,92,246,0.6)]"
          >
            P
          </span>
          {APP.name}
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] text-[color:var(--color-ink-muted)] md:flex">
          <a className="transition-colors hover:text-white" href="#features">
            Features
          </a>
          <a className="transition-colors hover:text-white" href="#download">
            Download
          </a>
          <a className="transition-colors hover:text-white" href="#install">
            Install help
          </a>
        </nav>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[12.5px] text-white/85 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
        >
          <GithubIcon className="h-3.5 w-3.5" />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}
