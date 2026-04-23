import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";

export interface StudyTask {
  id: string;
  title: string;
  /** Optional hint ("DSA", "Interview", etc.). Shown as a subtle tag. */
  tag?: string;
  done: boolean;
  createdAt: number;
  /** Timestamp when the task was completed — used to fade done items at day end. */
  completedAt?: number;
}

interface TasksStore {
  tasks: StudyTask[];
  add: (title: string, tag?: string) => StudyTask;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearCompleted: () => void;
  reorder: (from: number, to: number) => void;
}

export const useTasks = create<TasksStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      add: (title, tag) => {
        const trimmed = title.trim();
        if (!trimmed) {
          return {
            id: "",
            title: "",
            done: false,
            createdAt: 0,
          };
        }
        const task: StudyTask = {
          id: nanoid(10),
          title: trimmed,
          tag,
          done: false,
          createdAt: Date.now(),
        };
        set((state) => ({ tasks: [task, ...state.tasks].slice(0, 100) }));
        return task;
      },
      toggle: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined }
              : t,
          ),
        }));
      },
      remove: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },
      clearCompleted: () => {
        set((state) => ({ tasks: state.tasks.filter((t) => !t.done) }));
      },
      reorder: (from, to) => {
        const list = [...get().tasks];
        if (from < 0 || from >= list.length || to < 0 || to >= list.length) return;
        const [moved] = list.splice(from, 1);
        list.splice(to, 0, moved);
        set({ tasks: list });
      },
    }),
    {
      name: "prepos:tasks",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function taskCounts(tasks: StudyTask[]): { total: number; done: number; pending: number } {
  let done = 0;
  for (const t of tasks) if (t.done) done++;
  return { total: tasks.length, done, pending: tasks.length - done };
}
