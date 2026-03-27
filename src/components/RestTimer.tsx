"use client";

import { useState, useEffect, useCallback } from "react";

interface RestTimerProps {
  running: boolean;
  onDismiss: () => void;
  initialSeconds?: number;
}

export function RestTimer({ running, onDismiss, initialSeconds = 90 }: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (running) {
      setSeconds(initialSeconds);
    }
  }, [running, initialSeconds]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  if (!running) return null;

  const progress = initialSeconds > 0 ? seconds / initialSeconds : 0;
  const isComplete = seconds <= 0;

  return (
    <div
      onClick={onDismiss}
      className={`fixed top-0 left-0 right-0 z-40 cursor-pointer transition-all ${
        isComplete
          ? "bg-[var(--accent-green)]/20 border-b-2 border-[var(--accent-green)]"
          : "bg-[var(--bg-card)] border-b border-white/10"
      }`}
    >
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <span className={`text-xs uppercase tracking-wider ${isComplete ? "text-[var(--accent-green)]" : "text-[var(--text-secondary)]"}`}>
          {isComplete ? "Ready!" : "Rest"}
        </span>
        <span className={`text-2xl font-mono font-bold tabular-nums ${
          isComplete ? "text-[var(--accent-green)]" : "text-[var(--text-primary)]"
        }`}>
          {isComplete ? "GO!" : formatTime(seconds)}
        </span>
        <span className="text-xs text-[var(--text-secondary)]">tap to dismiss</span>
      </div>
      {/* Progress bar */}
      {!isComplete && (
        <div className="h-1 bg-[var(--bg-secondary)]">
          <div
            className="h-full bg-[var(--accent-blue)] transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
