"use client";

import { useEffect } from "react";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-[var(--bg-card)] border border-[var(--text-secondary)]/20 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg z-50">
      <span className="text-sm">{message}</span>
      <button
        onClick={onUndo}
        className="ml-3 px-3 py-1 text-sm font-bold text-[var(--accent-blue)] active:text-[var(--accent-blue)]/70"
      >
        UNDO
      </button>
    </div>
  );
}
