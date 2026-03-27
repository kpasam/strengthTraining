"use client";

import { useState } from "react";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  theme: string;
  onThemeToggle: () => void;
  onSynced?: () => void;
}

export function SettingsModal({ open, onClose, theme, onThemeToggle, onSynced }: SettingsModalProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  if (!open) return null;

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data.success ? `Synced ${data.synced} days` : "Sync failed");
      if (data.success) onSynced?.();
    } catch {
      setSyncResult("Sync failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 3000);
    }
  }

  async function handleLogout() {
    if (!confirm("Are you sure you want to log out?")) return;
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[var(--bg-card)] rounded-t-2xl shadow-2xl">
        {/* Fixed handle + title — never scrolls */}
        <div className="max-w-lg mx-auto w-full px-6 pt-4 pb-3">
          <div className="w-10 h-1 bg-[var(--text-secondary)]/30 rounded-full mx-auto mb-5" />
          <h2 className="text-base font-bold">Settings</h2>
        </div>
        {/* Scrollable body */}
        <div className="max-w-lg mx-auto w-full px-6 pb-6 overflow-y-auto" style={{ maxHeight: "calc(80vh - 72px)" }}>

          <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mt-4 mb-2">Appearance</p>
          <div className="bg-[var(--bg-secondary)] rounded-xl mb-5 overflow-hidden">
            <button
              onClick={onThemeToggle}
              className="w-full flex items-center justify-between px-4 py-3 active:opacity-70"
            >
              <span className="text-sm font-medium">Theme</span>
              <span className="text-sm text-[var(--text-secondary)]">{theme === "dark" ? "Dark" : "Light"}</span>
            </button>
          </div>

          <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Data</p>
          <div className="bg-[var(--bg-secondary)] rounded-xl mb-5 overflow-hidden divide-y divide-white/5">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full flex items-center justify-between px-4 py-3 active:opacity-70 disabled:opacity-50"
            >
              <span className="text-sm font-medium">{syncing ? "Syncing…" : "Sync from Google Slides"}</span>
              {syncResult && <span className="text-xs text-[var(--text-secondary)]">{syncResult}</span>}
            </button>
            <a
              href="/api/export?format=csv"
              className="flex items-center justify-between px-4 py-3 active:opacity-70"
            >
              <span className="text-sm font-medium">Export Workout Data</span>
              <span className="text-xs text-[var(--text-secondary)]">CSV ↓</span>
            </a>
          </div>

          <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Account</p>
          <div className="bg-[var(--accent-red)]/10 rounded-xl overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 active:opacity-70"
            >
              <span className="text-sm font-medium text-[var(--accent-red)]">Log Out</span>
            </button>
          </div>

          <div style={{ height: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>
    </>
  );
}
