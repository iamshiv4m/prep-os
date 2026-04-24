import { ShieldCheck, Terminal, Apple, Monitor, Container } from "lucide-react";

export default function InstallNote() {
  return (
    <section id="install" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-100/85">
            <ShieldCheck className="h-3 w-3" /> First-launch help
          </div>
          <h2 className="text-balance text-[32px] font-semibold tracking-[-0.015em] text-white sm:text-[40px]">
            One-time OS warning. <span className="text-white/55">Here&apos;s how to bypass.</span>
          </h2>
          <p className="max-w-2xl text-[14.5px] leading-relaxed text-white/60">
            PrepOS ships without paid Apple notarization or Windows EV signing — so your OS will
            warn you on first launch. The app is fully open-source, you can read every line on
            GitHub. Follow the steps below once, and the OS remembers your choice forever.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card
            icon={<Apple className="h-4 w-4" />}
            title="macOS"
            platform="Gatekeeper"
            subtitle="“Apple cannot check it for malicious software.”"
          >
            <ol className="space-y-3 text-[13.5px] text-white/80">
              <Step n={1}>
                <b>Don&apos;t run PrepOS from the DMG.</b> Open the DMG and{" "}
                <b>drag PrepOS.app onto the /Applications shortcut</b> next to it, then eject the
                DMG.
                <span className="mt-1.5 block text-[11.5px] text-white/45">
                  Launching straight from the mounted disk image triggers a repeat warning every
                  time. Copying to <b>/Applications</b> is a one-time step.
                </span>
              </Step>
              <Step n={2}>
                Double-click <Kbd>/Applications/PrepOS.app</Kbd>. If macOS asks{" "}
                <i>&ldquo;Are you sure you want to open it?&rdquo;</i> click <b>Open</b> — this is a
                one-time confirmation.
              </Step>
              <Step n={3}>
                <b>If macOS blocks it instead</b> (&ldquo;Apple cannot check it for malicious
                software&rdquo; with no <i>Open Anyway</i> button), strip the quarantine flag in
                Terminal:
                <CodeBlock>xattr -dr com.apple.quarantine /Applications/PrepOS.app</CodeBlock>
                <span className="mt-1.5 block text-[11.5px] text-white/45">
                  Works on every macOS version including Sequoia 15+, where Apple removed the{" "}
                  <b>Open Anyway</b> button for unsigned apps. Double-click afterwards — Gatekeeper
                  stays quiet from here on.
                </span>
              </Step>
              <Step n={4}>
                <span className="text-white/55">Older macOS only:</span> right-click{" "}
                <Kbd>PrepOS.app</Kbd> → <b>Open</b> and confirm in the dialog, or visit{" "}
                <b>System Settings → Privacy &amp; Security → Open Anyway</b>. On Sequoia these are
                hidden — use the Terminal fix above.
              </Step>
            </ol>
          </Card>

          <Card
            icon={<Monitor className="h-4 w-4" />}
            title="Windows"
            platform="SmartScreen"
            subtitle="“Windows protected your PC.”"
          >
            <ol className="space-y-3 text-[13.5px] text-white/80">
              <Step n={1}>
                Click <b>More info</b> in the blue dialog → <b>Run anyway</b>.
              </Step>
              <Step n={2}>
                If silently blocked, right-click the installer → <b>Properties</b> → check{" "}
                <b>Unblock</b> → <b>OK</b>.
              </Step>
              <Step n={3}>Run the installer again. SmartScreen remembers from now on.</Step>
            </ol>
          </Card>

          <Card
            icon={<Container className="h-4 w-4" />}
            title="Linux"
            platform="AppImage"
            subtitle="One step, then run forever."
          >
            <ol className="space-y-3 text-[13.5px] text-white/80">
              <Step n={1}>
                Right-click the AppImage → <b>Properties → Permissions</b> → check{" "}
                <b>Allow executing as program</b>.
              </Step>
              <Step n={2}>
                Or via terminal:
                <CodeBlock>
                  chmod +x PrepOS-*.AppImage{"\n"}
                  ./PrepOS-*.AppImage
                </CodeBlock>
              </Step>
              <Step n={3}>On first launch it auto-integrates into your launcher / dock.</Step>
            </ol>
          </Card>
        </div>

        <div className="mt-12 flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:flex-row sm:items-center sm:gap-4">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/10">
            <Terminal className="h-4 w-4 text-violet-300" />
          </div>
          <p className="text-[13px] leading-relaxed text-white/65">
            Prefer to build from source? Run <Kbd>npm install &amp;&amp; npm run dev</Kbd> from the
            repo root — full instructions in the README.
          </p>
        </div>
      </div>
    </section>
  );
}

function Card({
  icon,
  title,
  platform,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  platform: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80">
          {icon}
        </span>
        <h3 className="text-[17px] font-semibold text-white">
          {title} <span className="text-white/45">— {platform}</span>
        </h3>
      </div>
      <p className="mt-3 min-h-[32px] text-[12px] italic leading-snug text-white/45">{subtitle}</p>
      <div className="mt-4 flex-1">{children}</div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex min-w-0 gap-2.5">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[10.5px] font-semibold text-white/80">
        {n}
      </span>
      <span className="min-w-0 flex-1 leading-relaxed">{children}</span>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <code className="kbd whitespace-nowrap">{children}</code>;
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-2 w-full overflow-x-auto rounded-md border border-white/10 bg-black/40 p-2.5 font-mono text-[11.5px] leading-relaxed text-white/85">
      <code className="whitespace-pre">{children}</code>
    </pre>
  );
}
