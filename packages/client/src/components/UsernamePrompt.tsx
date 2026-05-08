import { useState } from "react";
import { PixelButton } from "./pixel/PixelButton.tsx";
import { PixelPanel } from "./pixel/PixelPanel.tsx";

interface UsernamePromptProps {
  onSubmit: (username: string) => void;
}

export function UsernamePrompt({ onSubmit }: UsernamePromptProps) {
  const [username, setUsername] = useState("");

  function submit() {
    const trimmed = username.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--color-felt)",
      }}
    >
      <PixelPanel style={{ width: 320, display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: 4,
          }}
        >
          Red 10
        </div>
        <div
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: 8,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-paper)",
            marginBottom: 8,
          }}
        >
          Enter your name
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            placeholder="Player name"
            style={{
              background: "var(--color-panel)",
              border: "none",
              boxShadow: "inset 0 0 0 2px var(--color-panel-border), inset 2px 2px 0 0 rgba(0,0,0,0.3)",
              color: "var(--color-paper)",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              padding: "8px 10px",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          <PixelButton disabled={!username.trim()} tone="accent" onClick={submit}>
            Join
          </PixelButton>
        </form>
      </PixelPanel>
    </div>
  );
}
