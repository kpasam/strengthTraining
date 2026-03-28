"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { SettingsModal } from "@/components/SettingsModal";
import { MoveExerciseModal } from "@/components/MoveExerciseModal";
import { VariantBadges } from "@/components/VariantBadge";
import Link from "next/link";

interface Exercise {
  id: number;
  exerciseId: number;
  canonicalName: string;
  variantFlags: string[];
  prescribedReps: string;
  prescribedNotes: string;
  isAccessory: boolean;
  completedSets: number;
}

interface Group {
  id: number;
  groupLabel: string;
  prescribedSets: number;
  exercises: Exercise[];
}

interface Plan {
  planId: number;
  date: string;
  groups: Group[];
}

function getTheme() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") || "dark";
}

function subscribeTheme(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const LIGHT_VARS: Record<string, string> = {"--bg-primary":"#f5f5f5","--bg-secondary":"#e8e8e8","--bg-card":"#ffffff","--text-primary":"#1a1a1a","--text-secondary":"#6b7280","--accent-green":"#16a34a","--accent-blue":"#2563eb","--accent-red":"#dc2626","--accent-yellow":"#ca8a04"};
const DARK_VARS: Record<string, string> = {"--bg-primary":"#0a0a0a","--bg-secondary":"#1a1a1a","--bg-card":"#222222","--text-primary":"#f0f0f0","--text-secondary":"#a0a0a0","--accent-green":"#22c55e","--accent-blue":"#3b82f6","--accent-red":"#ef4444","--accent-yellow":"#eab308"};

function shiftDate(date: string, days: number): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

export default function HomePage() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "dark");

  useEffect(() => {
    // Apply CSS variable overrides since Tailwind v4 processes :root vars
    const vars = theme === "light" ? LIGHT_VARS : DARK_VARS;
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [username, setUsername] = useState<string>("");
  const [date, setDate] = useState(() => {
    if (typeof window !== "undefined") {
      const d = new URLSearchParams(window.location.search).get("date");
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    }
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [introText, setIntroText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [isManualComplete, setIsManualComplete] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  interface MoveTarget { exerciseGroupId: number; exerciseName: string; currentGroupLabel: string }
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [moving, setMoving] = useState(false);
  const [confirmEarlyEnd, setConfirmEarlyEnd] = useState(false);

  const handleAskSteve = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(data.synced > 0 ? "Synced!" : "Already up to date");
        await fetchPlan();
      } else {
        setSyncMsg("Sync failed");
      }
    } catch {
      setSyncMsg("Sync failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(""), 3000);
    }
  };

  const deleteExercise = async (workoutGroupExerciseId: number) => {
    setRemovingId(workoutGroupExerciseId);
    try {
      await fetch("/api/workout/plan-exercise", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutGroupExerciseId }),
      });
      await fetchPlan();
    } finally {
      setRemovingId(null);
    }
  };

  const handleMove = async (targetGroupLabel: string) => {
    if (!moveTarget) return;
    setMoving(true);
    try {
      await fetch("/api/workout/plan-exercise", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutGroupExerciseId: moveTarget.exerciseGroupId, targetGroupLabel }),
      });
      setMoveTarget(null);
      await fetchPlan();
    } finally {
      setMoving(false);
    }
  };

  const handleThemeToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const getGroupProgress = useCallback((group: Group) => {
    const mainExercises = group.exercises.filter((e) => !e.isAccessory);
    const totalSets = mainExercises.reduce((acc, e) => acc + (e.completedSets || 0), 0);
    const targetSets = group.prescribedSets * mainExercises.length;
    return { totalSets, targetSets };
  }, []);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      let res: Response;
      try {
        res = await fetch(`/api/workout/today?date=${date}`, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPlan(data.plan);
      setUsername(data.username);

      // Check server-side manual completion
      let manualComplete = false;
      try {
        const completeRes = await fetch(`/api/workout/complete?date=${date}`);
        const completeData = await completeRes.json();
        manualComplete = completeData.complete || false;
        setIsManualComplete(manualComplete);
      } catch {
        setIsManualComplete(false);
      }

      if (data.plan) {
        setIntroText("");
        setSummaryText("");

        let allComplete = manualComplete;
        
        if (!allComplete) {
          allComplete = true;
          for (const g of data.plan.groups) {
            const { totalSets, targetSets } = getGroupProgress(g);
            if (targetSets > 0 && totalSets < targetSets) {
              allComplete = false;
              break;
            }
          }
        }

        const type = allComplete ? "summary" : "intro";
        fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, plan: data.plan }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (type === "summary") setSummaryText(d.text);
            else setIntroText(d.text);
          })
          .catch(() => {});
      }
    } catch {
      setPlan(null);
      setUsername("");
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [date, getGroupProgress]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);
  const formatDate = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Gym Tracker</h1>
          <div className="flex items-center gap-2 mt-1">
            {username && (
              <>
                <p className="text-sm font-bold text-[var(--accent-blue)]">@{username}</p>
                <span className="text-[var(--text-secondary)] text-xs">•</span>
              </>
            )}
            <p className="text-sm text-[var(--text-secondary)]">{formatDate(date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="text-base font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] w-8 h-8 flex items-center justify-center rounded-lg active:opacity-70"
            aria-label="Previous day"
          >
            ‹
          </button>
          <label className="relative cursor-pointer">
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] px-2 py-1.5 rounded-lg select-none block">
              {new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
            />
          </label>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            className="text-base font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] w-8 h-8 flex items-center justify-center rounded-lg active:opacity-70"
            aria-label="Next day"
          >
            ›
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-[var(--text-secondary)] bg-[var(--bg-card)] w-8 h-8 flex items-center justify-center rounded-lg active:opacity-70 ml-1"
            aria-label="Settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-4 w-48 mt-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--bg-card)] border border-white/5 rounded-xl p-4">
              <div className="skeleton h-5 w-24 mb-3" />
              <div className="skeleton h-3 w-full mb-2" />
              <div className="skeleton h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-[var(--text-secondary)] mb-3 font-medium">Could not load workout data</p>
          <button
            onClick={fetchPlan}
            className="text-sm px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : !plan || plan.groups.length === 0 ? (
        <div className="py-8">
          <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
            No plan for this day. What would you like to do?
          </p>
          <div className="space-y-3">
            <Link
              href={`/add-exercise?date=${date}`}
              className="flex items-center gap-4 p-5 bg-[var(--bg-card)] border border-white/5 rounded-2xl active:opacity-70 transition-opacity"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--accent-blue)]/15 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[var(--accent-blue)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Add an Exercise</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Pick from the exercise catalog</p>
              </div>
            </Link>

            <Link
              href={`/exercises/new?date=${date}`}
              className="flex items-center gap-4 p-5 bg-[var(--bg-card)] border border-white/5 rounded-2xl active:opacity-70 transition-opacity"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--accent-yellow)]/15 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[var(--accent-yellow)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Create Exercise</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Define a new exercise for your catalog</p>
              </div>
            </Link>

            <button
              onClick={handleAskSteve}
              disabled={syncing}
              className="w-full flex items-center gap-4 p-5 bg-[var(--bg-card)] border border-white/5 rounded-2xl active:opacity-70 transition-opacity disabled:opacity-50"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--accent-green)]/15 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[var(--accent-green)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-[var(--text-primary)]">
                  {syncing ? "Syncing…" : "Ask Steve"}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {syncMsg || "Sync today's plan from slides"}
                </p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            // Find first group that is not fully completed
            const firstUnfinishedGroup = plan.groups.find(g => {
              const { totalSets, targetSets } = getGroupProgress(g);
              return targetSets > 0 && totalSets < targetSets;
            });
            const targetGroup = firstUnfinishedGroup || plan.groups[0];
            const showComplete = isManualComplete || !firstUnfinishedGroup;

            return (
              <div className="mb-6">
                {!showComplete ? (
                  <>
                    <Link
                      href={`/workout/${targetGroup.groupLabel}?date=${date}`}
                      className="block w-full py-4 text-center bg-[var(--accent-blue)] text-white font-bold text-lg rounded-xl shadow-lg active:opacity-80 transition-opacity"
                    >
                      START / RESUME WORKOUT
                    </Link>
                    {introText && (
                      <div className="mt-4 p-4 border-l-4 border-[var(--accent-blue)] bg-[var(--bg-card)] rounded-r-xl shadow-sm">
                        <p className="text-sm italic text-[var(--text-primary)]">
                          "{introText}"
                        </p>
                      </div>
                    )}
                    {confirmEarlyEnd ? (
                      <div className="mt-3 flex items-center justify-center gap-3">
                        <span className="text-xs text-[var(--text-secondary)]">End early?</span>
                        <button
                          onClick={() => setConfirmEarlyEnd(false)}
                          className="px-3 py-1 rounded-lg bg-[var(--bg-card)] text-xs font-medium active:opacity-70"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            setConfirmEarlyEnd(false);
                            await fetch('/api/workout/complete', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ date }),
                            });
                            setIsManualComplete(true);
                            fetchPlan();
                          }}
                          className="px-3 py-1 rounded-lg bg-[var(--accent-red)] text-white text-xs font-bold active:opacity-70"
                        >
                          End
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmEarlyEnd(true)}
                        className="mt-3 text-xs text-[var(--accent-red)]/50 active:text-[var(--accent-red)] transition-colors w-full text-center py-2"
                      >
                        mark complete early
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bg-[var(--accent-green)]/10 p-5 rounded-2xl border border-[var(--accent-green)]/30 shadow-lg text-center">
                    <span className="text-3xl mb-2 block">🏆</span>
                    <h2 className="text-xl font-bold text-[var(--accent-green)] mb-3">WORKOUT COMPLETE!</h2>
                    {summaryText && (
                      <p className="text-sm text-[var(--text-primary)] italic leading-relaxed">
                        "{summaryText}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {plan.groups.map((group) => {
            const { totalSets, targetSets } = getGroupProgress(group);
            const isComplete = totalSets >= targetSets && targetSets > 0;

            return (
              <Link
                key={group.id}
                href={`/workout/${group.groupLabel}?date=${date}`}
                className={`block p-4 rounded-xl transition-colors ${
                  isComplete
                    ? "bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30"
                    : "bg-[var(--bg-card)] border border-white/5 active:bg-[var(--bg-secondary)]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">
                    Group {group.groupLabel}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isComplete ? "text-[var(--accent-green)]" : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {totalSets}/{targetSets} sets
                  </span>
                </div>

                {group.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1 text-sm ${
                      ex.isAccessory
                        ? "text-[var(--text-secondary)] ml-4 italic"
                        : "text-[var(--text-primary)]"
                    } ${i > 0 ? "mt-1" : ""}`}
                  >
                    <span className="flex-1 min-w-0">
                      {ex.isAccessory && "* "}
                      <span className="capitalize">{ex.canonicalName}</span>
                      <VariantBadges flags={ex.variantFlags} />
                      {ex.prescribedReps && (
                        <span className="text-[var(--text-secondary)]">
                          {" "}
                          — {ex.prescribedReps}
                          {ex.prescribedNotes && ` (${ex.prescribedNotes})`}
                        </span>
                      )}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMoveTarget({ exerciseGroupId: ex.id, exerciseName: ex.canonicalName, currentGroupLabel: group.groupLabel });
                      }}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[var(--text-secondary)]/40 active:text-[var(--accent-blue)] transition-colors"
                      aria-label={`Move ${ex.canonicalName}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h12m0 0l-4-4m4 4l-4 4" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteExercise(ex.id);
                      }}
                      disabled={removingId === ex.id}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[var(--text-secondary)]/40 active:text-[var(--accent-red)] transition-colors disabled:opacity-30"
                      aria-label={`Remove ${ex.canonicalName}`}
                    >
                      {removingId === ex.id ? (
                        <span className="text-xs">…</span>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
                {/* Progress bar */}
                {targetSets > 0 && (
                  <div className="mt-3 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isComplete ? "bg-[var(--accent-green)]" : "bg-[var(--accent-blue)]"
                      }`}
                      style={{ width: `${Math.min(100, (totalSets / targetSets) * 100)}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })}

          {/* Add / Create exercise links */}
          <div className="flex items-center justify-center gap-4 py-2">
            <Link
              href={`/add-exercise?date=${date}`}
              className="flex items-center gap-1.5 py-2 text-sm text-[var(--text-secondary)] active:text-[var(--accent-blue)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Exercise
            </Link>
            <span className="text-[var(--text-secondary)]/30 text-xs">|</span>
            <Link
              href={`/exercises/new?date=${date}`}
              className="flex items-center gap-1.5 py-2 text-sm text-[var(--text-secondary)] active:text-[var(--accent-yellow)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Create Exercise
            </Link>
          </div>
        </div>
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onSynced={fetchPlan}
      />
      <MoveExerciseModal
        open={moveTarget !== null}
        exerciseName={moveTarget?.exerciseName ?? ""}
        currentGroupLabel={moveTarget?.currentGroupLabel ?? ""}
        groups={plan?.groups.map((g) => ({ id: g.id, groupLabel: g.groupLabel, exerciseNames: g.exercises.map((e) => e.canonicalName) })) ?? []}
        onMove={handleMove}
        onClose={() => setMoveTarget(null)}
        moving={moving}
      />
    </div>
  );
}
