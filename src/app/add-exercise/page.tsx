"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface CatalogExercise {
  id: number;
  canonicalName: string;
  bodyPart: string | null;
  intensity: string | null;
  movementType: string | null;
  equipment: string | null;
}

const BODY_PARTS = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Full Body"];
const BODY_PART_VALUES: Record<string, string> = {
  "Chest": "chest",
  "Back": "back",
  "Legs": "legs",
  "Shoulders": "shoulders",
  "Arms": "arms",
  "Core": "core",
  "Full Body": "full_body",
};

const INTENSITY_COLORS: Record<string, string> = {
  low: "text-[var(--accent-green)] bg-[var(--accent-green)]/10",
  moderate: "text-[var(--accent-yellow)] bg-[var(--accent-yellow)]/10",
  high: "text-[var(--accent-red)] bg-[var(--accent-red)]/10",
};

function AddExerciseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const highlightId = parseInt(searchParams.get("highlight") ?? "", 10) || null;

  const [exercises, setExercises] = useState<CatalogExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeBodyPart, setActiveBodyPart] = useState("All");
  const highlightRef = useRef<HTMLButtonElement | null>(null);

  // Bottom sheet state
  const [selected, setSelected] = useState<CatalogExercise | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("8,8,8");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Group picker state
  const [groups, setGroups] = useState<{ id: number; groupLabel: string; exerciseNames: string[] }[]>([]);
  const [selectedGroupLabel, setSelectedGroupLabel] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeBodyPart !== "All") params.set("bodyPart", BODY_PART_VALUES[activeBodyPart]);

    try {
      const res = await fetch(`/api/exercises/catalog?${params}`);
      const data = await res.json();
      setExercises(data.exercises ?? []);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeBodyPart]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // Scroll highlighted exercise into view after list loads
  useEffect(() => {
    if (!loading && highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, highlightId]);

  useEffect(() => {
    if (!selected) return;
    setSelectedGroupLabel(null);
    fetch(`/api/workout/add-exercise?date=${date}`)
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => setGroups([]));
  }, [selected, date]);

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/workout/add-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          exerciseId: selected.id,
          prescribedSets: sets,
          prescribedReps: reps,
          ...(selectedGroupLabel ? { targetGroupLabel: selectedGroupLabel } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? "Failed to add exercise");
        return;
      }
      // Go back to home so user can see their full plan and start the workout
      router.push(`/?date=${date}`);
    } catch {
      setAddError("Network error, please try again");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href={`/?date=${date}`}
          className="text-[var(--text-secondary)] bg-[var(--bg-card)] w-8 h-8 flex items-center justify-center rounded-lg active:opacity-70 shrink-0"
          aria-label="Back"
        >
          ‹
        </Link>
        <div>
          <h1 className="text-xl font-bold">Add an Exercise</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Pick from the catalog</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[var(--bg-card)] border border-white/5 text-sm px-3 py-2.5 rounded-xl outline-none mb-3 placeholder:text-[var(--text-secondary)]"
      />

      {/* Body part filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none scroll-fade-x">
        {BODY_PARTS.map((bp) => (
          <button
            key={bp}
            onClick={() => setActiveBodyPart(bp)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors active:opacity-70 ${
              activeBodyPart === bp
                ? "bg-[var(--accent-blue)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
            }`}
          >
            {bp}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          No exercises found.
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex) => {
            const isHighlighted = ex.id === highlightId;
            return (
              <button
                key={ex.id}
                ref={isHighlighted ? highlightRef : null}
                onClick={() => {
                  setSelected(ex);
                  setSets(3);
                  setReps("8,8,8");
                  setAddError("");
                }}
                className={`w-full flex items-center gap-3 p-4 bg-[var(--bg-card)] border rounded-xl text-left active:opacity-70 transition-all ${
                  isHighlighted
                    ? "border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/30"
                    : "border-white/5"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize text-[var(--text-primary)] leading-snug">
                    {ex.canonicalName}
                    {isHighlighted && (
                      <span className="ml-2 text-xs text-[var(--accent-blue)] font-normal">New</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {ex.bodyPart && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] capitalize">
                        {ex.bodyPart.replace("_", " ")}
                      </span>
                    )}
                    {ex.movementType && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-secondary)] capitalize">
                        {ex.movementType}
                      </span>
                    )}
                    {ex.intensity && (
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${INTENSITY_COLORS[ex.intensity] ?? "text-[var(--text-secondary)] bg-white/5"}`}>
                        {ex.intensity}
                      </span>
                    )}
                    {ex.equipment && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-secondary)] capitalize">
                        {ex.equipment}
                      </span>
                    )}
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--text-secondary)] shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}

          {/* Create exercise prompt */}
          <Link
            href={`/exercises/new?date=${date}`}
            className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--text-secondary)] active:text-[var(--accent-blue)] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Don't see your exercise? Create it
          </Link>
        </div>
      )}

      {/* Bottom sheet config */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelected(null)}
          />
          {/* Sheet */}
          <div className="relative bg-[var(--bg-card)] rounded-t-3xl p-6 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            <p className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wide">Selected</p>
            <h2 className="text-lg font-bold capitalize mb-1">{selected.canonicalName}</h2>
            <div className="flex gap-1.5 mb-6">
              {selected.bodyPart && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] capitalize">
                  {selected.bodyPart.replace("_", " ")}
                </span>
              )}
              {selected.movementType && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-secondary)] capitalize">
                  {selected.movementType}
                </span>
              )}
            </div>

            {/* Group picker chips */}
            {groups.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Add to group</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none scroll-fade-x">
                  <button
                    onClick={() => setSelectedGroupLabel(null)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors active:opacity-70 ${
                      selectedGroupLabel === null
                        ? "bg-[var(--accent-blue)] text-white"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    }`}
                  >
                    + New Group
                  </button>
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroupLabel(g.groupLabel)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors active:opacity-70 max-w-[160px] truncate ${
                        selectedGroupLabel === g.groupLabel
                          ? "bg-[var(--accent-blue)] text-white"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {g.groupLabel} · {g.exerciseNames.join(", ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sets input — hidden when adding to existing group (group already has its own sets) */}
            {selectedGroupLabel ? (
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Sets follow Group {selectedGroupLabel}
              </p>
            ) : (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-[var(--text-primary)]">Sets</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSets((s) => Math.max(1, s - 1))}
                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold flex items-center justify-center active:opacity-70"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-bold text-[var(--text-primary)]">{sets}</span>
                  <button
                    onClick={() => setSets((s) => s + 1)}
                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold flex items-center justify-center active:opacity-70"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Reps input */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-[var(--text-primary)]">Reps</span>
              <input
                type="text"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-28 bg-[var(--bg-secondary)] border border-white/5 text-sm text-center px-2 py-1.5 rounded-lg outline-none text-[var(--text-primary)]"
                placeholder="8,8,8"
              />
            </div>

            {addError && (
              <p className="text-xs text-[var(--accent-red)] mb-3 text-center">{addError}</p>
            )}

            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full py-4 bg-[var(--accent-blue)] text-white font-bold rounded-xl active:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {adding ? "Adding…" : "ADD TO PLAN"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddExercisePage() {
  return (
    <Suspense>
      <AddExerciseContent />
    </Suspense>
  );
}
