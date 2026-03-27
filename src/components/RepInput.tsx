"use client";

interface RepInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function RepInput({ value, onChange }: RepInputProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => { navigator.vibrate?.(10); onChange(Math.max(0, (value || 0) - 1)); }}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-lg font-bold active:bg-[var(--accent-red)]/30 transition-colors"
      >
        −
      </button>

      <input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : parseInt(v, 10));
        }}
        placeholder="0"
        className="w-16 h-10 text-center text-lg font-bold bg-[var(--bg-secondary)] rounded-lg border-none outline-none
                   focus:ring-2 focus:ring-[var(--accent-blue)]"
      />

      <button
        onClick={() => { navigator.vibrate?.(10); onChange((value || 0) + 1); }}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-lg font-bold active:bg-[var(--accent-green)]/30 transition-colors"
      >
        +
      </button>

      <span className="ml-1 text-sm text-[var(--text-secondary)]">reps</span>
    </div>
  );
}
