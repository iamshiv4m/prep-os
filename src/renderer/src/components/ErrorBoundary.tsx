import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level safety net. A thrown error anywhere in the React tree would
 * otherwise unmount the whole app into a blank screen; we catch it and
 * surface a friendly recovery panel with options to reload or reset
 * persisted state (in case a Zustand persist blob is corrupt).
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[prepos] render crash:", error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleResetLocal = (): void => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("prepos:"));
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* noop */
    }
    window.location.reload();
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.25), transparent 60%), #0a0a0f",
          color: "white",
          fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          zIndex: 99999,
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: "100%",
            background: "rgba(20,20,28,0.85)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 28,
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,120,120,0.85)",
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            PrepOS hit a snag
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
            Something broke while rendering.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13.5, lineHeight: 1.55 }}>
            Try reloading first. If the crash keeps coming back, resetting local preferences clears
            dock layout, tasks, and persisted UI state — your API keys, notes, chats, and focus
            history are safe (stored separately).
          </p>
          <pre
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              fontSize: 11.5,
              color: "rgba(255,200,200,0.85)",
              overflow: "auto",
              maxHeight: 180,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.message}
          </pre>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              onClick={this.handleReload}
              style={{
                background: "white",
                color: "black",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload PrepOS
            </button>
            <button
              onClick={this.handleResetLocal}
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reset UI preferences & reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
