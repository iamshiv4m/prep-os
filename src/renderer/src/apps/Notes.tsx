import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import type { Note } from "@shared/types";

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const active = useMemo(() => notes.find((n) => n.id === activeId), [notes, activeId]);

  useEffect(() => {
    (async () => {
      const list = await window.prepOS.notes.list();
      const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
      setNotes(sorted);
      setActiveId(sorted[0]?.id ?? null);
    })();
  }, []);

  const createNote = useCallback(async () => {
    const note: Note = {
      id: nanoid(10),
      title: "Untitled",
      body: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    await window.prepOS.notes.save(note);
  }, []);

  const updateNote = useCallback(
    async (patch: Partial<Note>) => {
      if (!active) return;
      const next: Note = { ...active, ...patch, updatedAt: Date.now() };
      setNotes((prev) => prev.map((n) => (n.id === next.id ? next : n)));
      await window.prepOS.notes.save(next);
    },
    [active],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await window.prepOS.notes.remove(id);
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        if (activeId === id) setActiveId(next[0]?.id ?? null);
        return next;
      });
    },
    [activeId],
  );

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.body.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full bg-neutral-950/80 text-white">
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-black/30">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="text-[13px] font-medium">Notes</div>
          <button
            onClick={createNote}
            className="rounded-md p-1 hover:bg-white/10"
            title="New note"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="px-3 pb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[12px] outline-none focus:border-white/25"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={
                "group mb-1 block w-full rounded-md px-2 py-1.5 text-left text-[12px] " +
                (activeId === n.id ? "bg-white/10" : "hover:bg-white/5")
              }
            >
              <div className="flex items-center justify-between">
                <span className="truncate font-medium">{n.title || "Untitled"}</span>
                <Trash2
                  className="hidden h-3 w-3 text-white/50 hover:text-red-300 group-hover:block"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(n.id);
                  }}
                />
              </div>
              <div className="truncate text-[11px] text-white/50">
                {n.body.slice(0, 60) || "No content"}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-[11px] text-white/50">No notes</div>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <>
            <input
              value={active.title}
              onChange={(e) => updateNote({ title: e.target.value })}
              placeholder="Title"
              className="border-b border-white/10 bg-transparent px-5 py-4 text-[18px] font-semibold outline-none placeholder:text-white/40"
            />
            <textarea
              value={active.body}
              onChange={(e) => updateNote({ body: e.target.value })}
              placeholder="Write markdown notes here…"
              className="min-h-0 flex-1 resize-none bg-transparent p-5 font-mono text-[13px] leading-relaxed outline-none placeholder:text-white/30"
            />
            <div className="border-t border-white/10 px-5 py-2 text-[11px] text-white/40">
              Updated {new Date(active.updatedAt).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-white/50">
            Create a note to get started
          </div>
        )}
      </section>
    </div>
  );
}
