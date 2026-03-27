"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { VariantBadges } from "@/components/VariantBadge";

interface ExercisePR {
  exerciseId: number;
  canonicalName: string;
  bestWeight: number | null;
  bestWeightUnit: string;
  repsAtBest: number | null;
  bestDate: string;
  variantFlags: string[];
  totalSessions: number;
  totalSets: number;
}

type SortKey = "name" | "pr" | "sessions" | "date";

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<ExercisePR[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/exercises/prs")
      .then((r) => r.json())
      .then((d) => {
        setExercises(d.exercises || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  }

  const filtered = exercises.filter((e) =>
    e.canonicalName.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") {
      cmp = a.canonicalName.localeCompare(b.canonicalName);
    } else if (sortKey === "pr") {
      cmp = (a.bestWeight ?? -1) - (b.bestWeight ?? -1);
    } else if (sortKey === "sessions") {
      cmp = a.totalSessions - b.totalSessions;
    } else if (sortKey === "date") {
      cmp = a.bestDate.localeCompare(b.bestDate);
    }
    return sortAsc ? cmp : -cmp;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="opacity-30 ml-1">↕</span>;
    return <span className="ml-1 text-[var(--accent-blue)]">{sortAsc ? "↑" : "↓"}</span>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Exercises</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {exercises.length} unique · personal records
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg active:opacity-70"
        >
          ← Today
        </Link>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[var(--bg-card)] border border-white/5 text-sm px-3 py-2.5 rounded-xl outline-none mb-4 placeholder:text-[var(--text-secondary)]"
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          {search ? "No exercises match your search." : "No exercises logged yet."}
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-white/5 rounded-xl overflow-hidden">
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.5rem" }} className=" gap-2 px-4 py-2.5 border-b border-white/5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            <button
              onClick={() => toggleSort("name")}
              className="text-left active:opacity-70"
            >
              Exercise <SortIcon k="name" />
            </button>
            <button
              onClick={() => toggleSort("pr")}
              className="text-right active:opacity-70 whitespace-nowrap"
            >
              PR <SortIcon k="pr" />
            </button>
            <button
              onClick={() => toggleSort("sessions")}
              className="text-right active:opacity-70 whitespace-nowrap"
            >
              Sessions <SortIcon k="sessions" />
            </button>
          </div>

          {/* Rows */}
          {sorted.map((ex, i) => (
            <Link
              key={ex.exerciseId}
              href={`/history/${ex.exerciseId}`}
              className={`grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 items-center active:bg-[var(--bg-secondary)] transition-colors ${
                i < sorted.length - 1 ? "border-b border-white/5" : ""
              }`}
            >
              {/* Exercise name + variant badges */}
              <div className="min-w-0">
                <p className="text-sm font-medium capitalize truncate leading-snug">
                  {ex.canonicalName}
                </p>
                {ex.variantFlags.length > 0 && (
                  <div className="mt-0.5">
                    <VariantBadges flags={ex.variantFlags} />
                  </div>
                )}
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {ex.totalSets} sets · PR {formatDate(ex.bestDate)}
                </p>
              </div>

              {/* PR weight */}
              <div className="text-right shrink-0">
                {ex.bestWeight !== null ? (
                  <>
                    <span className="text-sm font-bold text-[var(--accent-green)]">
                      {ex.bestWeight}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] ml-0.5">
                      {ex.bestWeightUnit}
                    </span>
                    {ex.repsAtBest !== null && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        × {ex.repsAtBest} reps
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-[var(--text-secondary)]">—</span>
                )}
              </div>

              {/* Sessions */}
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold">{ex.totalSessions}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
