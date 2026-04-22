import Editor from "@monaco-editor/react";
import { Play, RotateCcw } from "lucide-react";
import { useCallback, useState } from "react";

const STARTER = `// Welcome to the Playground.
// Try some JavaScript below — output appears on the right.
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (seen.has(diff)) return [seen.get(diff), i];
    seen.set(nums[i], i);
  }
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9));
`;

export default function Playground() {
  const [code, setCode] = useState(STARTER);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const run = useCallback(() => {
    setOutput([]);
    setRunning(true);
    const iframe = document.createElement("iframe");
    iframe.sandbox.add("allow-scripts");
    iframe.style.display = "none";
    iframe.srcdoc = `<!doctype html><html><body><script>
      (function() {
        const logs = [];
        const fmt = (a) => {
          if (a === null) return 'null';
          if (a === undefined) return 'undefined';
          if (typeof a === 'object') {
            try { return JSON.stringify(a, null, 2); } catch { return String(a); }
          }
          return String(a);
        };
        const log = (level) => (...args) => {
          logs.push({ level, line: args.map(fmt).join(' ') });
        };
        console.log = log('log');
        console.info = log('info');
        console.warn = log('warn');
        console.error = log('error');
        try {
          ${"new Function(" + JSON.stringify(code) + ")()"}
        } catch (err) {
          logs.push({ level: 'error', line: (err && err.stack) || String(err) });
        }
        parent.postMessage({ source: 'prep-os-sandbox', logs }, '*');
      })();
    </script></body></html>`;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.source !== "prep-os-sandbox") return;
      window.removeEventListener("message", onMsg);
      setOutput(e.data.logs.map((l: { level: string; line: string }) => `[${l.level}] ${l.line}`));
      setRunning(false);
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", onMsg);
    document.body.appendChild(iframe);
  }, [code]);

  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e] text-white">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2 text-[12px]">
        <div className="flex items-center gap-2 font-medium">
          <span>🎮</span> Playground · JavaScript
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCode(STARTER);
              setOutput([]);
            }}
            className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-1 rounded-md bg-green-500 px-3 py-1 text-[11px] font-medium text-black hover:bg-green-400 disabled:opacity-50"
          >
            <Play className="h-3 w-3" /> Run
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 divide-x divide-white/10">
        <div className="flex-1">
          <Editor
            theme="vs-dark"
            defaultLanguage="javascript"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
            }}
          />
        </div>
        <div className="flex w-[38%] flex-col bg-black/60">
          <div className="border-b border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-wide text-white/50">
            Output
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px]">
            {output.length === 0 && (
              <div className="text-white/40">
                {running ? "Running…" : "No output yet. Click Run."}
              </div>
            )}
            {output.map((line, i) => (
              <pre key={i} className="whitespace-pre-wrap break-words text-white/85">
                {line}
              </pre>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
