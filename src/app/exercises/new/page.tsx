"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const BODY_PARTS = [
  { label: "Chest", value: "chest" },
  { label: "Back", value: "back" },
  { label: "Legs", value: "legs" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Arms", value: "arms" },
  { label: "Core", value: "core" },
  { label: "Full Body", value: "full_body" },
];

const INTENSITIES = [
  { label: "Low", value: "low" },
  { label: "Moderate", value: "moderate" },
  { label: "High", value: "high" },
];

const MOVEMENT_TYPES = [
  { label: "Compound", value: "compound" },
  { label: "Isolation", value: "isolation" },
];

const EQUIPMENT_OPTIONS = [
  { label: "Barbell", value: "barbell" },
  { label: "Dumbbell", value: "dumbbell" },
  { label: "Bodyweight", value: "bodyweight" },
  { label: "Cable", value: "cable" },
  { label: "Kettlebell", value: "kettlebell" },
  { label: "Band", value: "band" },
  { label: "Plate", value: "plate" },
  { label: "Sled", value: "sled" },
];

function SelectChips({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? "" : opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors active:opacity-70 ${
            value === opt.value
              ? "bg-[var(--accent-blue)] text-white"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NewExerciseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

  const [name, setName] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [intensity, setIntensity] = useState("");
  const [movementType, setMovementType] = useState("");
  const [equipment, setEquipment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Exercise name is required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/exercises/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canonicalName: trimmed,
          bodyPart: bodyPart || undefined,
          intensity: intensity || undefined,
          movementType: movementType || undefined,
          equipment: equipment || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create exercise");
        return;
      }
      // Navigate to catalog with the new exercise highlighted
      router.push(`/add-exercise?date=${date}&highlight=${data.id}`);
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/add-exercise?date=${date}`}
          className="text-[var(--text-secondary)] bg-[var(--bg-card)] w-8 h-8 flex items-center justify-center rounded-lg active:opacity-70 shrink-0"
          aria-label="Back"
        >
          ‹
        </Link>
        <div>
          <h1 className="text-xl font-bold">Create Exercise</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Add a new exercise to the catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Exercise Name <span className="text-[var(--accent-red)]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. cable fly"
            autoFocus
            className="w-full bg-[var(--bg-card)] border border-white/5 text-sm px-3 py-3 rounded-xl outline-none placeholder:text-[var(--text-secondary)] text-[var(--text-primary)]"
          />
        </div>

        {/* Body Part */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Body Part <span className="text-[var(--text-secondary)]/50 font-normal normal-case">(optional)</span>
          </label>
          <SelectChips options={BODY_PARTS} value={bodyPart} onChange={setBodyPart} />
        </div>

        {/* Intensity */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Intensity <span className="text-[var(--text-secondary)]/50 font-normal normal-case">(optional)</span>
          </label>
          <SelectChips options={INTENSITIES} value={intensity} onChange={setIntensity} />
        </div>

        {/* Movement Type */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Movement Type <span className="text-[var(--text-secondary)]/50 font-normal normal-case">(optional)</span>
          </label>
          <SelectChips options={MOVEMENT_TYPES} value={movementType} onChange={setMovementType} />
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Equipment <span className="text-[var(--text-secondary)]/50 font-normal normal-case">(optional)</span>
          </label>
          <SelectChips options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />
        </div>

        {error && (
          <p className="text-sm text-[var(--accent-red)] text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full py-4 bg-[var(--accent-blue)] text-white font-bold rounded-xl active:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {submitting ? "Creating…" : "CREATE & ADD TO CATALOG"}
        </button>
      </form>
    </div>
  );
}

export default function NewExercisePage() {
  return (
    <Suspense>
      <NewExerciseContent />
    </Suspense>
  );
}
