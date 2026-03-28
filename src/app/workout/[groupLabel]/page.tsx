"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { WeightInput } from "@/components/WeightInput";
import { RepInput } from "@/components/RepInput";
import { VariantBadges } from "@/components/VariantBadge";
import { UndoToast } from "@/components/UndoToast";

interface LogEntry {
  id: number;
  setNumber: number;
  weight: number | null;
  weightUnit: string;
  reps: number | null;
  notes: string;
}

interface PreviousBest {
  weight: number | null;
  weightUnit: string;
  reps: number | null;
  date: string;
  variantFlags: string[];
  notes: string;
}

interface RepBest {
  weight: number;
  weightUnit: string;
  reps: number;
  date: string;
  variantFlags: string[];
  notes: string;
}

interface Exercise {
  id: number;
  exerciseId: number;
  canonicalName: string;
  variantFlags: string[];
  prescribedReps: string;
  prescribedNotes: string;
  isAccessory: boolean;
  previousBest: PreviousBest | null;
  repBests: Record<number, RepBest>;
  lastUsedUnit: "lbs" | "kg";
  todayLogs: LogEntry[];
  completedSets: number;
}

interface Group {
  id: number;
  groupLabel: string;
  prescribedSets: number;
  exercises: Exercise[];
}

function getTargetReps(prescribedReps: string | null, completedSets: number): number | null {
  if (!prescribedReps) return null;
  const parts = prescribedReps.split(",").map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n));
  if (parts.length === 0) return null;
  if (completedSets < parts.length) {
    return parts[completedSets];
  }
  return parts[parts.length - 1];
}

function WorkoutGroupContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const groupLabel = params.groupLabel as string;
  const date = searchParams.get("date") || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

  const [group, setGroup] = useState<Group | null>(null);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [weight, setWeight] = useState<number | null>(null);
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const [reps, setReps] = useState<number | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [hasInitRoundRobin, setHasInitRoundRobin] = useState(false);
  const [undoLog, setUndoLog] = useState<{ id: number; message: string } | null>(null);
  const [prCelebration, setPrCelebration] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/workout/today?date=${date}`);
      const data = await res.json();
      if (data.plan) {
        const g = data.plan.groups.find(
          (g: Group) => g.groupLabel === groupLabel
        );
        setGroup(g || null);
      }
    } finally {
      setLoading(false);
    }
  }, [date, groupLabel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set initial active exercise based on completed sets (start with set1/least sets)
  useEffect(() => {
    if (!group || hasInitRoundRobin) return;
    const allExercises = group.exercises;
    
    let minSets = Infinity;
    let nextIdx = 0;
    for (let i = 0; i < allExercises.length; i++) {
        if (allExercises[i].completedSets < minSets) {
            minSets = allExercises[i].completedSets;
            nextIdx = i;
        }
    }
    setActiveExerciseIdx(nextIdx);
    setHasInitRoundRobin(true);
  }, [group, hasInitRoundRobin]);

  // Pre-fill weight/unit when active exercise changes
  useEffect(() => {
    if (!group) return;
    const allExercises = group.exercises;
    const ex = allExercises[activeExerciseIdx];
    if (!ex) return;

    // Auto-fill target reps
    const targetRep = getTargetReps(ex.prescribedReps, ex.completedSets || 0);
    setReps(targetRep);

    // Try rep-specific best first, fall back to previousBest
    const repBest = targetRep !== null ? ex.repBests?.[targetRep] : null;

    if (repBest) {
      setWeight(repBest.weight);
      setWeightUnit((repBest.weightUnit as "lbs" | "kg") || ex.lastUsedUnit);
    } else if (ex.previousBest) {
      setWeight(ex.previousBest.weight);
      setWeightUnit((ex.previousBest.weightUnit as "lbs" | "kg") || ex.lastUsedUnit);
    } else {
      setWeight(null);
      setWeightUnit(ex.lastUsedUnit);
    }

    setRpe(null);
    setIsBodyweight(false);
    setNotes("");
    setShowNotes(false);
    setEditingLogId(null);
  }, [activeExerciseIdx, group]);

  const handleLog = async (exerciseId: number, variantFlags: string[]) => {
    if (!group) return;

    const allExercises = group.exercises;
    const ex = allExercises[activeExerciseIdx];
    const setNumber = (ex?.completedSets || 0) + 1;

    const method = editingLogId ? "PUT" : "POST";
    const logWeight = isBodyweight ? null : weight;
    const bodyPayload = editingLogId
      ? { id: editingLogId, weight: logWeight, weightUnit, reps, rpe, notes }
      : {
          date,
          exerciseId,
          variantFlags,
          groupLabel,
          setNumber,
          weight: logWeight,
          weightUnit,
          reps,
          rpe,
          notes,
        };

    try {
      const res = await fetch("/api/log", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success) {
        setErrorMsg(null);
        if (!editingLogId) {
          setUndoLog({ id: data.log.id, message: `Set ${setNumber} logged` });
        }
        setEditingLogId(null);
        setRpe(null);
        setNotes("");
        setShowNotes(false);
        fetchData();

        // Check for new PR (rep-specific)
        if (!editingLogId && weight !== null && activeExercise && reps !== null) {
          const repBest = activeExercise.repBests?.[reps];
          const prevBest = activeExercise.previousBest;

          const beatRepBest = repBest && weight > repBest.weight;
          const beatOverall = !repBest && (!prevBest || (prevBest.weight !== null && weight > prevBest.weight));

          if (beatRepBest || beatOverall) {
            setPrCelebration(`New PR! ${weight}${weightUnit} × ${reps}`);
            setTimeout(() => setPrCelebration(null), 4000);
          }
        }
      } else {
        setErrorMsg(data.error || "Failed to save set");
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch {
      setErrorMsg("Network error — check your connection");
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleEditSet = (log: LogEntry) => {
    setEditingLogId(log.id);
    setWeight(log.weight);
    setWeightUnit(log.weightUnit as "lbs" | "kg");
    setReps(log.reps);
    if (log.notes) {
      setNotes(log.notes);
      setShowNotes(true);
    } else {
      setNotes("");
      setShowNotes(false);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm("Are you sure you want to delete this set?")) return;
    try {
      const res = await fetch("/api/log", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setErrorMsg("Failed to delete set");
        setTimeout(() => setErrorMsg(null), 3000);
        return;
      }
      if (editingLogId === id) {
        setEditingLogId(null);
        setNotes("");
        setShowNotes(false);
      }
      fetchData();
    } catch {
      setErrorMsg("Network error — check your connection");
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || !group) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Only trigger if horizontal swipe is dominant and > 60px
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

    const allExercises = group.exercises;
    if (dx < 0 && activeExerciseIdx < allExercises.length - 1) {
      setActiveExerciseIdx(activeExerciseIdx + 1);
    } else if (dx > 0 && activeExerciseIdx > 0) {
      setActiveExerciseIdx(activeExerciseIdx - 1);
    }
  };

  const handleUndo = async () => {
    if (!undoLog) return;
    await fetch("/api/log", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: undoLog.id }),
    });
    setUndoLog(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-5 w-24" />
          <div className="w-12" />
        </div>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 w-28 rounded-lg" />)}
        </div>
        <div className="bg-[var(--bg-card)] border border-white/5 rounded-xl p-4">
          <div className="skeleton h-6 w-40 mb-3" />
          <div className="skeleton h-4 w-32 mb-4" />
          <div className="skeleton h-10 w-full mb-3" />
          <div className="skeleton h-10 w-full mb-3" />
          <div className="skeleton h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-secondary)]">Group not found</p>
        <Link href={`/?date=${date}`} className="text-[var(--accent-blue)] text-sm mt-2 block">
          Back
        </Link>
      </div>
    );
  }

  const allExercises = group.exercises;
  const activeExercise = allExercises[activeExerciseIdx];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/?date=${date}`}
          className="text-[var(--accent-blue)] text-sm"
        >
          ← Back
        </Link>
        <div className="text-center">
          <h2 className="text-lg font-bold">Group {groupLabel}</h2>
          <span className="text-xs font-mono text-[var(--text-secondary)] tabular-nums">{formatElapsed(elapsed)}</span>
        </div>
        <div />
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="mb-3 px-3 py-2 bg-[var(--accent-red)]/20 text-[var(--accent-red)] text-sm rounded-lg text-center">
          {errorMsg}
        </div>
      )}

      {/* Exercise tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {allExercises.map((ex, idx) => (
          <button
            key={ex.id}
            onClick={() => setActiveExerciseIdx(idx)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              idx === activeExerciseIdx
                ? "bg-[var(--accent-blue)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
            }`}
          >
            {ex.isAccessory && <span className="mr-1 text-[var(--text-secondary)]">*</span>}
            <span className="capitalize">{ex.canonicalName}</span>
            {ex.completedSets > 0 && (
              <span className="ml-1 text-xs opacity-70">
                ({ex.completedSets})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active exercise */}
      {activeExercise && (
        <div
          className="bg-[var(--bg-card)] border border-white/5 rounded-xl p-4 mb-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold capitalize">
              {activeExercise.canonicalName}
              <VariantBadges flags={activeExercise.variantFlags} />
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Target: {activeExercise.prescribedReps} reps
              {activeExercise.prescribedNotes && ` • ${activeExercise.prescribedNotes}`}
            </p>
          </div>

          {/* Previous best — rep-specific when available */}
          {(() => {
            const targetRep = getTargetReps(activeExercise.prescribedReps, activeExercise.completedSets || 0);
            const repBest = targetRep !== null ? activeExercise.repBests?.[targetRep] : null;

            if (repBest) {
              return (
                <Link
                  href={`/history/${activeExercise.exerciseId}?date=${date}`}
                  className="block mb-3 px-3 py-2 rounded-lg bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/30 text-sm"
                >
                  <span className="text-[var(--accent-yellow)] font-semibold">Best for {targetRep} reps: </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {repBest.weight}{repBest.weightUnit}
                  </span>
                  <span className="text-[var(--text-secondary)]"> ({repBest.date})</span>
                </Link>
              );
            }

            if (activeExercise.previousBest) {
              return (
                <Link
                  href={`/history/${activeExercise.exerciseId}?date=${date}`}
                  className="block mb-3 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-sm"
                >
                  <span className="text-[var(--text-secondary)]">Previous: </span>
                  <span className="font-medium">
                    {activeExercise.previousBest.weight}
                    {activeExercise.previousBest.weightUnit} × {activeExercise.previousBest.reps}
                  </span>
                  <span className="text-[var(--text-secondary)]"> ({activeExercise.previousBest.date})</span>
                  {activeExercise.previousBest.variantFlags.length > 0 && (
                    <VariantBadges flags={activeExercise.previousBest.variantFlags} />
                  )}
                </Link>
              );
            }

            return null;
          })()}

          {/* Bodyweight toggle + Weight input */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[var(--text-secondary)]">Weight</label>
              <button
                onClick={() => setIsBodyweight(!isBodyweight)}
                className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                  isBodyweight
                    ? "bg-[var(--accent-blue)] text-white"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                }`}
              >
                BW
              </button>
            </div>
            {!isBodyweight && (
              <WeightInput
                value={weight}
                unit={weightUnit}
                onChange={setWeight}
                onUnitChange={setWeightUnit}
              />
            )}
            {isBodyweight && (
              <p className="text-sm text-[var(--text-secondary)] italic">Bodyweight</p>
            )}
          </div>

          {/* Reps input */}
          <div className="mb-3">
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">
              Reps
            </label>
            <RepInput value={reps} onChange={setReps} />
          </div>

          {/* RPE selector */}
          <div className="mb-3">
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">
              Effort <span className="text-[var(--text-secondary)] opacity-60">(optional)</span>
            </label>
            <div className="flex gap-2">
              {([
                { label: "Easy", value: 7, activeClass: "bg-[var(--accent-green)] text-black" },
                { label: "Normal", value: 8, activeClass: "bg-[var(--accent-yellow)] text-black" },
                { label: "Hard", value: 9.5, activeClass: "bg-[var(--accent-red)] text-white" },
              ] as const).map(({ label, value, activeClass }) => (
                <button
                  key={value}
                  onClick={() => setRpe(rpe === value ? null : value)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                    rpe === value
                      ? activeClass
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes toggle */}
          <div className="mb-3">
            {showNotes ? (
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] rounded-lg border-none outline-none
                           focus:ring-2 focus:ring-[var(--accent-blue)]"
              />
            ) : (
              <button
                onClick={() => setShowNotes(true)}
                className="text-xs text-[var(--text-secondary)] underline"
              >
                + Add note
              </button>
            )}
          </div>

          {/* LOG SET button */}
          <button
            onClick={() =>
              handleLog(activeExercise.exerciseId, activeExercise.variantFlags)
            }
            className={`w-full py-4 rounded-xl text-black font-bold text-lg transition-colors ${
              editingLogId
                ? "bg-[var(--accent-blue)] active:bg-[var(--accent-blue)]/80"
                : "bg-[var(--accent-green)] active:bg-[var(--accent-green)]/80"
            }`}
          >
            {editingLogId ? "UPDATE SET" : `LOG SET ${(activeExercise.completedSets || 0) + 1}`}
          </button>

          {editingLogId && (
            <button
              onClick={() => {
                setEditingLogId(null);
                setNotes("");
                setShowNotes(false);
              }}
              className="w-full mt-2 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium active:bg-[var(--bg-secondary)]/80 transition-colors"
            >
              Cancel Edit
            </button>
          )}

          {/* Today's set history */}
          {activeExercise.todayLogs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--text-secondary)]/10">
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Today
              </p>
              <div className="space-y-1">
                {activeExercise.todayLogs.map((log) => (
                  <div key={log.id} className="text-sm flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary)]">
                        Set {log.setNumber}:
                      </span>
                      <span className={`font-medium ${editingLogId === log.id ? "text-[var(--accent-blue)]" : ""}`}>
                        {log.weight !== null ? `${log.weight}${log.weightUnit} × ${log.reps}` : `${log.reps} reps`}
                      </span>
                      {log.notes && (
                        <span className="text-xs text-[var(--text-secondary)]">
                          ({log.notes})
                        </span>
                      )}
                      {!editingLogId && <span className="text-[var(--accent-green)]">✓</span>}
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                      <button 
                        onClick={() => handleEditSet(log)} 
                        className="text-[var(--text-secondary)] active:text-[var(--accent-blue)] p-1"
                        aria-label="Edit set"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteLog(log.id)} 
                        className="text-[var(--text-secondary)] active:text-[var(--accent-red)] p-1"
                        aria-label="Delete set"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PR celebration toast */}
      {prCelebration && (
        <div
          onClick={() => setPrCelebration(null)}
          className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-[var(--bg-card)] border border-[var(--accent-yellow)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg z-50 animate-fadeIn"
        >
          <span className="text-2xl">🏆</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--accent-yellow)]">{prCelebration}</p>
            <p className="text-xs text-[var(--text-secondary)]">New personal record!</p>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {undoLog && (
        <UndoToast
          message={undoLog.message}
          onUndo={handleUndo}
          onDismiss={() => setUndoLog(null)}
        />
      )}
    </div>
  );
}

export default function WorkoutGroupPage() {
  return (
    <Suspense>
      <WorkoutGroupContent />
    </Suspense>
  );
}
