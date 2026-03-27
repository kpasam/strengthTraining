"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
    });
    
    const data = await res.json();
    if (data.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(data.error || "Login failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm bg-[var(--bg-card)] p-6 rounded-2xl shadow-lg border border-white/5">
        <div className="text-center mb-6">
          <svg className="mx-auto mb-3 w-12 h-12 text-[var(--accent-blue)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5a4 4 0 0 1 8 0v1a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-1Z" />
            <path d="M9.5 13.5a4 4 0 0 1 8 0v1a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-1Z" />
            <path d="M10.5 7.5v6" />
          </svg>
          <h1 className="text-2xl font-bold">Gym Tracker</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Track your strength. Build your legacy.</p>
        </div>
        {error && (
          <div className="bg-[var(--accent-red)]/20 text-[var(--accent-red)] p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
              placeholder="e.g. kpasam"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
              placeholder="4-digit PIN"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 mt-2 bg-[var(--accent-blue)] text-white font-bold rounded-xl active:opacity-80 transition-opacity"
          >
            ENTER
          </button>
        </form>
        <p className="text-xs text-center text-[var(--text-secondary)] mt-4">
          Note: Entering a new username auto-creates an account.
        </p>
      </div>
    </div>
  );
}
