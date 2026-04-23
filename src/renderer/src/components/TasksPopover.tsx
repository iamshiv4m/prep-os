import { Check, CheckCircle2, CheckSquare, Circle, Plus, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import Popover from "./Popover";
import { useTasks, taskCounts, type StudyTask } from "../store/tasks";
import { useShell } from "../store/shell";
import clsx from "../utils/clsx";

const QUICK_TAGS = ["DSA", "Interview", "Revise", "Project", "Read"];

function TaskRow({ task }: { task: StudyTask }) {
  const toggle = useTasks((s) => s.toggle);
  const remove = useTasks((s) => s.remove);

  return (
    <div
      className={clsx(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
        task.done ? "opacity-60" : "hover:bg-white/[0.05]",
      )}
    >
      <button
        onClick={() => toggle(task.id)}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/25 text-white/70 transition-colors hover:border-white/50 data-[done=true]:border-emerald-400 data-[done=true]:bg-emerald-500/80 data-[done=true]:text-white"
        data-done={task.done}
        aria-label={task.done ? "Mark as pending" : "Mark as done"}
      >
        {task.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className={clsx(
            "truncate text-[12.5px]",
            task.done ? "text-white/45 line-through" : "text-white/90",
          )}
        >
          {task.title}
        </div>
      </div>
      {task.tag && (
        <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-[1px] text-[9.5px] font-medium uppercase tracking-wider text-white/50">
          {task.tag}
        </span>
      )}
      <button
        onClick={() => remove(task.id)}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-white/30 opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-red-300 group-hover:opacity-100"
        aria-label="Delete"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function TasksPopover() {
  const tasks = useTasks((s) => s.tasks);
  const add = useTasks((s) => s.add);
  const clearCompleted = useTasks((s) => s.clearCompleted);
  const openSignal = useShell((s) => s.tasksOpenNonce);

  const [input, setInput] = useState("");
  const [pickedTag, setPickedTag] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const counts = useMemo(() => taskCounts(tasks), [tasks]);
  const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  const submit = () => {
    if (!input.trim()) return;
    add(input, pickedTag);
    setInput("");
  };

  return (
    <Popover
      width={340}
      align="end"
      openSignal={openSignal}
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          className={clsx(
            "relative flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-white/10",
            open && "bg-white/10",
          )}
          title="Today's tasks"
        >
          <CheckSquare className="h-3.5 w-3.5 opacity-85" />
          {counts.pending > 0 && (
            <span className="rounded-full bg-white/10 px-1 text-[9.5px] font-semibold tabular-nums text-white/80">
              {counts.pending}
            </span>
          )}
        </button>
      )}
    >
      <div className="border-b border-white/10 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white/85">
            <CheckSquare className="h-3.5 w-3.5" />
            Today&apos;s tasks
          </div>
          <div className="text-[10.5px] tabular-nums text-white/55">
            {counts.done}/{counts.total} done
          </div>
        </div>
        {counts.total > 0 && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400/80 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      <div className="border-b border-white/10 px-2.5 py-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-1.5 ring-1 ring-white/[0.06] focus-within:ring-white/20">
          <Plus className="h-3.5 w-3.5 text-white/40" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a task (e.g. Solve 3 graph problems)"
            className="flex-1 bg-transparent text-[12px] text-white/90 placeholder:text-white/35 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
          {input.trim() && (
            <button
              onClick={submit}
              className="rounded-md bg-white/10 px-2 py-0.5 text-[10.5px] font-medium text-white/90 hover:bg-white/20"
            >
              Add ⏎
            </button>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {QUICK_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setPickedTag(pickedTag === t ? undefined : t)}
              className={clsx(
                "rounded-full px-1.5 py-[1px] text-[9.5px] font-medium uppercase tracking-wider transition-colors",
                pickedTag === t
                  ? "bg-white/20 text-white"
                  : "bg-white/[0.05] text-white/45 hover:bg-white/[0.08]",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto p-1.5">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <Circle className="h-7 w-7 text-white/15" />
            <div className="mt-2 text-[12px] font-medium text-white/65">No tasks yet</div>
            <div className="mt-0.5 text-[11px] text-white/35">
              Add your goals for the day — stay intentional.
            </div>
          </div>
        ) : (
          tasks.map((t) => <TaskRow key={t.id} task={t} />)
        )}
      </div>

      {counts.done > 0 && (
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5">
          <div className="flex items-center gap-1 text-[10.5px] text-white/45">
            <CheckCircle2 className="h-3 w-3" /> {counts.done} completed
          </div>
          <button
            onClick={clearCompleted}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] text-white/45 hover:bg-white/[0.08] hover:text-red-200"
          >
            <Trash2 className="h-3 w-3" /> Clear done
          </button>
        </div>
      )}
    </Popover>
  );
}
