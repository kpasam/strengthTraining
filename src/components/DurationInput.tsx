"use client";

interface DurationInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(":");
  const mins = parseInt(parts[0] || "0", 10) || 0;
  const secs = parseInt(parts[1] || "0", 10) || 0;
  return mins * 60 + secs;
}

export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function DurationInput({ value, onChange }: DurationInputProps) {
  const parts = value.split(":");
  const mins = parts[0] || "";
  const secs = parts[1] || "";

  const update = (m: string, s: string) => {
    const mNum = m === "" ? "" : String(Math.max(0, parseInt(m, 10) || 0));
    const sNum = s === "" ? "" : String(Math.min(59, Math.max(0, parseInt(s, 10) || 0)));
    onChange(`${mNum}:${sNum.padStart(sNum ? 2 : 0, "0")}`);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        value={mins}
        onChange={(e) => update(e.target.value, secs)}
        placeholder="0"
        className="w-20 h-12 text-center text-lg font-bold bg-[var(--bg-secondary)] rounded-lg border-none outline-none
                   focus:ring-2 focus:ring-[var(--accent-blue)]"
      />
      <span className="text-xl font-bold text-[var(--text-secondary)]">:</span>
      <input
        type="number"
        inputMode="numeric"
        value={secs}
        onChange={(e) => update(mins, e.target.value)}
        placeholder="00"
        min={0}
        max={59}
        className="w-20 h-12 text-center text-lg font-bold bg-[var(--bg-secondary)] rounded-lg border-none outline-none
                   focus:ring-2 focus:ring-[var(--accent-blue)]"
      />
      <span className="text-sm text-[var(--text-secondary)]">min:sec</span>
    </div>
  );
}
