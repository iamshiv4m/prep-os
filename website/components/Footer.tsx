import GithubIcon from "@/components/icons/GithubIcon";
import Logo from "@/components/icons/Logo";
import { APP, REPO_URL } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo instanceId="footer-logo" className="h-7 w-7" />
          <div>
            <div className="text-[13px] font-semibold text-white">{APP.name}</div>
            <div className="text-[11.5px] text-white/60">
              Built with care · MIT licensed · v{APP.version}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-white/55">
          <a className="transition-colors hover:text-white" href="#features">
            Features
          </a>
          <a className="transition-colors hover:text-white" href="#download">
            Download
          </a>
          <a className="transition-colors hover:text-white" href="#install">
            Install help
          </a>
          <a
            className="flex items-center gap-1.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${APP.name} source code on GitHub`}
          >
            <GithubIcon className="h-3.5 w-3.5" /> Source
          </a>
        </div>
      </div>
    </footer>
  );
}
