import { ShieldCheck, Terminal } from "lucide-react";

export default function InstallNote() {
  return (
    <section id="install" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-100/85">
            <ShieldCheck className="h-3 w-3" /> First-launch help
          </div>
          <h2 className="text-balance text-[32px] font-semibold tracking-[-0.015em] text-white sm:text-[40px]">
            One-time OS warning. <span className="text-white/55">Here's how to bypass.</span>
          </h2>
          <p className="max-w-2xl text-[14.5px] leading-relaxed text-white/60">
            PrepOS is currently shipped without paid Apple notarization or Windows EV signing — so
            the OS will warn you on first launch. The app is open-source, you can read every line on
            GitHub. Use the steps below to get past the dialog. After the first launch, the OS
            remembers your choice forever.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card
            title="macOS — Gatekeeper"
            subtitle="“Apple cannot check it for malicious software.”"
          >
            <ol className="space-y-2.5 text-[13.5px] text-white/80">
              <Step n={1}>
                Right-click <code className="kbd">PrepOS.app</code> → <b>Open</b> → <b>Open</b>{" "}
                again in the dialog.
              </Step>
              <Step n={2}>
                Or open <b>System Settings → Privacy &amp; Security</b> and click <b>Open Anyway</b>
                .
              </Step>
              <Step n={3}>
                If macOS still blocks, run in Terminal:
                <pre className="mt-2 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-2.5 font-mono text-[11.5px] text-white/85">
                  <code>xattr -dr com.apple.quarantine /Applications/PrepOS.app</code>
                </pre>
              </Step>
            </ol>
          </Card>

          <Card title="Windows — SmartScreen" subtitle="“Windows protected your PC.”">
            <ol className="space-y-2.5 text-[13.5px] text-white/80">
              <Step n={1}>
                Click <b>More info</b> in the blue dialog → <b>Run anyway</b>.
              </Step>
              <Step n={2}>
                If silently blocked, right-click installer → <b>Properties</b> → check{" "}
                <b>Unblock</b> at the bottom → <b>OK</b>.
              </Step>
              <Step n={3}>Run installer again. SmartScreen remembers from now on.</Step>
            </ol>
          </Card>

          <Card title="Linux — AppImage" subtitle="One step, then run forever.">
            <ol className="space-y-2.5 text-[13.5px] text-white/80">
              <Step n={1}>
                Right-click the AppImage → <b>Properties → Permissions</b> → check{" "}
                <b>Allow executing as program</b>.
              </Step>
              <Step n={2}>
                Or via terminal:
                <pre className="mt-2 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-2.5 font-mono text-[11.5px] text-white/85">
                  <code>chmod +x PrepOS-*.AppImage{"\n"}./PrepOS-*.AppImage</code>
                </pre>
              </Step>
              <Step n={3}>
                On first launch it integrates itself into your launcher / dock automatically.
              </Step>
            </ol>
          </Card>
        </div>

        <div className="border-white/8 mt-12 flex flex-col items-start gap-2 rounded-2xl border bg-white/[0.025] p-5 sm:flex-row sm:items-center">
          <Terminal className="h-4 w-4 text-violet-300" />
          <p className="text-[13px] text-white/65">
            Prefer to build from source?{" "}
            <code className="kbd">npm install &amp;&amp; npm run dev</code> from the repo root —
            full instructions in the README.
          </p>
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="text-[11px] uppercase tracking-[0.15em] text-white/45">{subtitle}</div>
      <h3 className="mt-2 text-[18px] font-semibold text-white">{title}</h3>
      <div className="mt-4 flex-1">{children}</div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[10.5px] font-semibold text-white/80">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
