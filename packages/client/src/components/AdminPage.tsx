import { useState } from "react";
import { Button } from "./ui/button.tsx";

type Status = { kind: "idle" } | { kind: "success" } | { kind: "error"; message: string };

export function AdminPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isResetting, setIsResetting] = useState(false);

  async function resetLobby() {
    setIsResetting(true);
    setStatus({ kind: "idle" });
    try {
      const response = await fetch("/admin/reset", { method: "POST" });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      setStatus({ kind: "success" });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Reset failed" });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <Button variant="destructive" size="lg" disabled={isResetting} onClick={resetLobby}>
        {isResetting ? "Resetting…" : "Reset Lobby"}
      </Button>
      {status.kind === "success" && (
        <p className="text-sm text-muted-foreground">Lobby reset. Players disconnected.</p>
      )}
      {status.kind === "error" && <p className="text-sm text-destructive">{status.message}</p>}
    </div>
  );
}
