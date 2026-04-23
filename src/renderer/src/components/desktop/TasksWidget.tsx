import { ArrowUpRight, CheckCircle2, Circle, ListTodo, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useShell } from "../../store/shell";
import { useTasks } from "../../store/tasks";
import Widget from "./Widget";

export default function TasksWidget({ delay }: { delay?: number }) {
  const tasks = useTasks((s) => s.tasks);
  const addTask = useTasks((s) => s.add);
  const toggle = useTasks((s) => s.toggle);
  const openTasksPopover = useShell((s) => s.openTasks);

  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);

  const pending = useMemo(() => tasks.filter((t) => !t.done).slice(0, 3), [tasks]);
  const done = tasks.filter((t) => t.done).length;

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addTask(trimmed);
    setDraft("");
    setComposing(false);
  };

  return (
    <Widget
      title="Today's Plan"
      icon={<ListTodo className="h-3 w-3" />}
      accent="radial-gradient(circle, rgba(34,197,94,0.45) 0%, transparent 70%)"
      delay={delay}
      onClick={openTasksPopover}
      action={
        <button
          onClick={(e) => {
            e.stopPropagation();
            setComposing((v) => !v);
          }}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-white/70 hover:border-white/30 hover:text-white"
          title="Add task"
        >
          <Plus className="h-3 w-3" />
        </button>
      }
    >
      {composing && (
        <div className="mb-2 flex items-center gap-1.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setComposing(false);
                setDraft("");
              }
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Add a task…"
            className="flex-1 rounded-md border border-white/15 bg-black/40 px-2 py-1 text-[12px] text-white outline-none focus:border-white/30"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              submit();
            }}
            className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/15"
          >
            Add
          </button>
        </div>
      )}

      {pending.length === 0 && !composing ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <div className="text-[13px] font-medium text-white/80">
            {done > 0 ? "All caught up 🎯" : "No tasks yet"}
          </div>
          <div className="text-[11px] text-white/45">
            {done > 0 ? `Nice — ${done} done today.` : "Tap + to add one."}
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {pending.map((t) => (
            <li key={t.id}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(t.id);
                }}
                className="group flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left text-[12.5px] text-white/85 hover:bg-white/5"
              >
                {t.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-white/40 group-hover:text-white/70" />
                )}
                <span className="truncate">{t.title}</span>
                {t.tag && (
                  <span className="ml-auto shrink-0 rounded-full border border-white/10 bg-white/5 px-1.5 py-[1px] text-[9px] uppercase tracking-wider text-white/55">
                    {t.tag}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-white/45">
        <span>{tasks.length > 0 ? `${done}/${tasks.length} done` : "Plan today's grind"}</span>
        <span className="flex items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-emerald-100 transition-colors group-hover:border-emerald-400/50 group-hover:bg-emerald-500/20">
          Open all <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Widget>
  );
}
