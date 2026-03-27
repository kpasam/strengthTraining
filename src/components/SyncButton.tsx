"use client";

import { useState } from "react";

export function SyncButton({ onSynced }: { onSynced?: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResult(`Synced ${data.synced} days`);
        onSynced?.();
      } else {
        setResult("Sync failed");
      }
    } catch {
      setResult("Sync failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setResult(null), 3000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-3 py-2 bg-[var(--bg-card)] rounded-lg text-sm font-medium
                   active:bg-[var(--accent-blue)] transition-colors disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync"}
      </button>
      {result && (
        <span className="text-xs text-[var(--text-secondary)]">{result}</span>
      )}
    </div>
  );
}
