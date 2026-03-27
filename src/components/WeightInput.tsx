"use client";

interface WeightInputProps {
  value: number | null;
  unit: "lbs" | "kg";
  onChange: (value: number | null) => void;
  onUnitChange: (unit: "lbs" | "kg") => void;
}

export function WeightInput({ value, unit, onChange, onUnitChange }: WeightInputProps) {
  const increment = unit === "lbs" ? 5 : 2.5;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => { navigator.vibrate?.(10); onChange(Math.max(0, (value || 0) - increment)); }}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-lg font-bold active:bg-[var(--accent-red)]/30 transition-colors"
      >
        −
      </button>

      <input
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : parseFloat(v));
        }}
        placeholder="0"
        className="w-20 h-10 text-center text-lg font-bold bg-[var(--bg-secondary)] rounded-lg border-none outline-none
                   focus:ring-2 focus:ring-[var(--accent-blue)]"
      />

      <button
        onClick={() => { navigator.vibrate?.(10); onChange((value || 0) + increment); }}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-lg font-bold active:bg-[var(--accent-green)]/30 transition-colors"
      >
        +
      </button>

      <button
        onClick={() => onUnitChange(unit === "lbs" ? "kg" : "lbs")}
        className="ml-1 px-2 h-10 rounded-lg text-sm font-bold bg-[var(--bg-secondary)] active:bg-[var(--accent-blue)]/30 transition-colors"
      >
        {unit}
      </button>
    </div>
  );
}
