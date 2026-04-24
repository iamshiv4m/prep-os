"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
  /** Source string. Use `\n` for multi-line. We render it raw inside <code>. */
  code: string;
  /** Optional ARIA label for the copy button (otherwise generic). */
  label?: string;
  /** Override default classes if you need a different surface. */
  className?: string;
}

/**
 * A small, framework-free code snippet with a one-click copy button.
 *
 * - Hides the horizontal scrollbar with `.no-scrollbar` (defined in globals.css)
 *   so long commands like `xattr -dr com.apple.quarantine /Applications/...`
 *   don't show an ugly bar inside our 1-of-3 install cards.
 * - Falls back to a hidden <textarea> + execCommand("copy") on browsers that
 *   block clipboard.writeText (older Safari, http:// previews, etc).
 * - Resets the "Copied" indicator after 1.6s so the button feels responsive
 *   without permanently signaling success.
 */
export default function CodeBlock({ code, label = "Copy code", className }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop — copy can fail when the page isn't focused; user can select manually */
    }
  };

  return (
    <div
      className={
        className ??
        "group relative mt-2 w-full overflow-hidden rounded-md border border-white/10 bg-black/40"
      }
    >
      <pre className="no-scrollbar w-full overflow-x-auto py-2.5 pl-2.5 pr-10 font-mono text-[11.5px] leading-relaxed text-white/85">
        <code className="whitespace-pre">{code}</code>
      </pre>

      <button
        type="button"
        onClick={onCopy}
        aria-label={label}
        title={copied ? "Copied" : label}
        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-black/50 text-white/55 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:ring-offset-1 focus:ring-offset-black/50"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}
