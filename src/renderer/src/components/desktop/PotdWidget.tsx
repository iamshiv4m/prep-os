import { ArrowUpRight, Code2 } from "lucide-react";
import { potdForToday, potdUrl } from "../../constants/potd";
import { openInApp } from "../../utils/openInApp";
import Widget from "./Widget";

const DIFF_COLOR: Record<string, string> = {
  Easy: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
  Medium: "text-amber-300 border-amber-400/30 bg-amber-500/10",
  Hard: "text-rose-300 border-rose-400/30 bg-rose-500/10",
};

export default function PotdWidget({ delay }: { delay?: number }) {
  const problem = potdForToday();

  const solve = () => {
    openInApp({ url: potdUrl(problem), title: problem.title });
  };

  return (
    <Widget
      title="Problem of the Day"
      icon={<Code2 className="h-3 w-3" />}
      accent="radial-gradient(circle, rgba(251,146,60,0.45) 0%, transparent 70%)"
      delay={delay}
      onClick={solve}
      action={
        <span
          className={
            "rounded-full border px-2 py-0.5 text-[10px] font-medium " +
            (DIFF_COLOR[problem.difficulty] ?? "")
          }
        >
          {problem.difficulty}
        </span>
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 text-[15.5px] font-semibold leading-snug text-white/95">
          {problem.title}
        </div>
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/45">
        {problem.topic}
      </div>
      <div className="mt-2 text-[12px] leading-relaxed text-white/65">{problem.hint}</div>
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="text-[11px] text-white/40">Fresh challenge, daily</span>
        <span className="flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.12)] transition-colors group-hover:border-amber-400/60 group-hover:bg-amber-500/25">
          Solve <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Widget>
  );
}
