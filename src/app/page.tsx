"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { SyncButton } from "@/components/SyncButton";
import { VariantBadges } from "@/components/VariantBadge";
import Link from "next/link";

interface Exercise {
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
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }));
  const [loading, setLoading] = useState(true);
  const [introText, setIntroText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [isManualComplete, setIsManualComplete] = useState(false);

  const getGroupProgress = useCallback((group: Group) => {
    const mainExercises = group.exercises.filter((e) => !e.isAccessory);
    const totalSets = mainExercises.reduce((acc, e) => acc + (e.completedSets || 0), 0);
    const targetSets = group.prescribedSets * mainExercises.length;
    return { totalSets, targetSets };
  }, []);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workout/today?date=${date}`);
      const data = await res.json();
      setPlan(data.plan);
      setUsername(data.username);

      // Check server-side manual completion
      try {
        const completeRes = await fetch(`/api/workout/complete?date=${date}`);
        const completeData = await completeRes.json();
        setIsManualComplete(completeData.complete || false);
      } catch {
        setIsManualComplete(false);
      }

      if (data.plan) {
        setIntroText("");
        setSummaryText("");
        
        let allComplete = isManualComplete;
        
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
        <div className="flex flex-col items-end gap-3 mt-1">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[var(--bg-card)] text-xs px-2 py-1.5 rounded outline-none"
            />
            <SyncButton onSynced={fetchPlan} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                localStorage.setItem("theme", next);
                document.documentElement.setAttribute("data-theme", next);
              }}
              className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg active:opacity-70"
            >
              {theme === "light" ? "\u{1F319}" : "\u{2600}\u{FE0F}"}
            </button>
            <a
              href="/api/export?format=csv"
              className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg active:opacity-70"
            >
              Export CSV
            </a>
            <button
              onClick={async () => {
                if (!confirm("Are you sure you want to log out?")) return;
                await fetch('/api/auth/login', { method: 'DELETE' });
                window.location.href = '/login';
              }}
              className="text-xs font-medium text-[var(--accent-red)] bg-[var(--accent-red)]/10 px-3 py-1.5 rounded-lg active:opacity-70"
            >
              Logout
            </button>
          </div>
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
      ) : !plan ? (
        <div className="text-center py-20">
          <svg className="mx-auto mb-4 w-16 h-16 text-[var(--text-secondary)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 6.5a4 4 0 0 1 8 0v1a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-1Z" />
            <path d="M9.5 13.5a4 4 0 0 1 8 0v1a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-1Z" />
            <path d="M10.5 7.5v6" />
          </svg>
          <p className="text-[var(--text-secondary)] mb-2 font-medium">No workout plan for this date</p>
          <p className="text-sm text-[var(--text-secondary)] opacity-70">
            Hit Sync to pull the latest plan from Google Slides
          </p>
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
                    <button
                      onClick={async () => {
                        if (confirm("End your workout early?")) {
                          await fetch('/api/workout/complete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ date }),
                          });
                          setIsManualComplete(true);
                          fetchPlan();
                        }
                      }}
                      className="mt-4 block w-full py-3 text-center border-2 border-[var(--accent-red)]/30 text-[var(--accent-red)] font-bold text-sm rounded-xl active:bg-[var(--accent-red)]/10 transition-colors"
                    >
                      COMPLETE WORKOUT (FINISH EARLY)
                    </button>
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
                    className={`text-sm ${
                      ex.isAccessory
                        ? "text-[var(--text-secondary)] ml-4 italic"
                        : "text-[var(--text-primary)]"
                    } ${i > 0 ? "mt-1" : ""}`}
                  >
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
        </div>
      )}
    </div>
  );
}
