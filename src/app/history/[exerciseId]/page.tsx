"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { VariantBadges } from "@/components/VariantBadge";

interface SetEntry {
  id: number;
  setNumber: number;
  weight: number | null;
  weightUnit: string;
  reps: number | null;
  notes: string;
  variantFlags: string[];
}

interface Session {
  date: string;
  sets: SetEntry[];
}

interface ExerciseInfo {
  id: number;
  canonicalName: string;
}

export default function ExerciseHistoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const exerciseId = params.exerciseId as string;
  const date = searchParams.get("date") || "";

  const [exercise, setExercise] = useState<ExerciseInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/history/${exerciseId}`);
      const data = await res.json();
      setExercise(data.exercise);
      setSessions(data.sessions);
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteSet = async (id: number) => {
    if (!confirm("Are you sure you want to delete this set?")) return;
    await fetch("/api/log", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchHistory();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-5 w-32" />
          <div className="w-12" />
        </div>
        <div className="bg-[var(--bg-card)] border border-white/5 rounded-xl p-3">
          <div className="skeleton h-3 w-24 mb-2" />
          <div className="skeleton h-6 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-white/5 rounded-xl p-3">
            <div className="skeleton h-4 w-28 mb-2" />
            <div className="skeleton h-3 w-full mb-1" />
            <div className="skeleton h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-secondary)]">Exercise not found</p>
        <Link href={date ? `/?date=${date}` : "/"} className="text-[var(--accent-blue)] text-sm mt-2 block">
          Back
        </Link>
      </div>
    );
  }

  // Find personal record (heaviest weight with at least 1 rep)
  let pr: { weight: number; weightUnit: string; reps: number; date: string } | null = null;
  for (const session of sessions) {
    for (const set of session.sets) {
      if (set.weight && set.reps && set.reps > 0) {
        if (!pr || set.weight > pr.weight) {
          pr = {
            weight: set.weight,
            weightUnit: set.weightUnit,
            reps: set.reps,
            date: session.date,
          };
        }
      }
    }
  }

  // Build chart data: best weight per session
  const chartData = sessions
    .map((s) => {
      let best = 0;
      for (const set of s.sets) {
        if (set.weight && set.weight > best) best = set.weight;
      }
      return { date: s.date, weight: best };
    })
    .filter((d) => d.weight > 0)
    .reverse(); // chronological order

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link href={date ? `/?date=${date}` : "/"} className="text-[var(--accent-blue)] text-sm">
          ← Back
        </Link>
        <h2 className="text-lg font-bold capitalize">{exercise.canonicalName}</h2>
        <div className="w-12" />
      </div>

      {/* Personal Record */}
      {pr && (
        <div className="bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/30 rounded-xl p-3 mb-4">
          <p className="text-xs text-[var(--accent-yellow)] uppercase tracking-wide mb-1">
            Personal Record
          </p>
          <p className="text-lg font-bold">
            {pr.weight}{pr.weightUnit} × {pr.reps}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">{pr.date}</p>
        </div>
      )}

      {/* Progress chart */}
      {chartData.length >= 2 && (() => {
        const weights = chartData.map((d) => d.weight);
        const minW = Math.min(...weights);
        const maxW = Math.max(...weights);
        const range = maxW - minW || 1;
        const padding = 24;
        const chartW = 320;
        const chartH = 120;
        const points = chartData.map((d, i) => {
          const x = padding + (i / (chartData.length - 1)) * (chartW - padding * 2);
          const y = chartH - padding - ((d.weight - minW) / range) * (chartH - padding * 2);
          return `${x},${y}`;
        });
        return (
          <div className="bg-[var(--bg-card)] border border-white/5 rounded-xl p-3 mb-4">
            <p className="text-xs text-[var(--text-secondary)] mb-2">Weight Progression</p>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = chartH - padding - pct * (chartH - padding * 2);
                const val = Math.round(minW + pct * range);
                return (
                  <g key={pct}>
                    <line x1={padding} y1={y} x2={chartW - padding} y2={y} stroke="var(--bg-secondary)" strokeWidth="1" />
                    <text x={padding - 4} y={y + 3} textAnchor="end" fill="var(--text-secondary)" fontSize="8">{val}</text>
                  </g>
                );
              })}
              {/* Line */}
              <polyline
                fill="none"
                stroke="var(--accent-blue)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points.join(" ")}
              />
              {/* Dots */}
              {chartData.map((d, i) => {
                const x = padding + (i / (chartData.length - 1)) * (chartW - padding * 2);
                const y = chartH - padding - ((d.weight - minW) / range) * (chartH - padding * 2);
                return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent-blue)" />;
              })}
            </svg>
            <div className="flex justify-between text-[8px] text-[var(--text-secondary)] mt-1 px-6">
              <span>{chartData[0].date}</span>
              <span>{chartData[chartData.length - 1].date}</span>
            </div>
          </div>
        );
      })()}

      {/* Sessions */}
      {sessions.length === 0 ? (
        <p className="text-center text-[var(--text-secondary)] py-10">
          No history yet
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.date} className="bg-[var(--bg-card)] border border-white/5 rounded-xl p-3">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                {session.date}
              </p>
              <div className="space-y-1">
                {session.sets.map((set) => (
                  <div key={set.id} className="text-sm flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary)] w-12">
                        Set {set.setNumber}
                      </span>
                      <span className="font-medium">
                        {set.weight !== null
                          ? `${set.weight}${set.weightUnit} × ${set.reps}`
                          : `${set.reps} reps`}
                      </span>
                      <VariantBadges flags={set.variantFlags} />
                      {set.notes && (
                        <span className="text-xs text-[var(--text-secondary)]">
                          ({set.notes})
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteSet(set.id)} 
                      className="text-[var(--text-secondary)] active:text-[var(--accent-red)] p-1 ml-2"
                      aria-label="Delete set"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
