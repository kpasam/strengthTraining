"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface WorkoutDay {
  date: string;
  totalSets: number;
  exercises: string[];
  groups: string[];
}

interface CalendarData {
  workoutDays: WorkoutDay[];
  weekCount: number;
  yearCount: number;
}

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Returns 0 = Monday, 6 = Sunday
function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay(); // 0 = Sun
  return d === 0 ? 6 : d - 1;
}

function padDate(n: number) {
  return String(n).padStart(2, "0");
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
  const [viewYear, setViewYear] = useState(() => parseInt(today.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(today.slice(5, 7)) - 1);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  const workoutSet = new Map<string, WorkoutDay>(
    (data?.workoutDays ?? []).map((d) => [d.date, d])
  );

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);

  // Build calendar grid (weeks × 7)
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Calendar</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Workout history
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg active:opacity-70"
        >
          ← Today
        </Link>
      </div>

      {/* Stats strip */}
      {loading ? (
        <div className="flex gap-3 mb-5">
          <div className="skeleton h-16 flex-1 rounded-xl" />
          <div className="skeleton h-16 flex-1 rounded-xl" />
        </div>
      ) : (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-[var(--bg-card)] border border-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[var(--accent-green)]">
              {data?.weekCount ?? 0}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">this week</p>
          </div>
          <div className="flex-1 bg-[var(--bg-card)] border border-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[var(--accent-blue)]">
              {data?.yearCount ?? 0}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">this year</p>
          </div>
          <div className="flex-1 bg-[var(--bg-card)] border border-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {data?.workoutDays.length ?? 0}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">all time</p>
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] active:opacity-70 text-lg"
        >
          ‹
        </button>
        <h2 className="font-semibold text-base">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h2>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] active:opacity-70 text-lg"
        >
          ›
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-[var(--bg-card)] border border-white/5 rounded-xl overflow-hidden mb-4">
        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }} className="border-b border-white/5">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-[var(--text-secondary)] py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} style={{ aspectRatio: "1 / 1" }} />;
            }
            const dateStr = `${viewYear}-${padDate(viewMonth + 1)}-${padDate(day)}`;
            const workout = workoutSet.get(dateStr);
            const isToday = dateStr === today;
            const isSelected = selectedDay?.date === dateStr;
            const isFuture = dateStr > today;

            return (
              <button
                key={dateStr}
                onClick={() =>
                  workout ? setSelectedDay(isSelected ? null : workout) : undefined
                }
                style={{ aspectRatio: "1 / 1" }}
                className={`flex flex-col items-center justify-center relative transition-colors ${
                  isSelected
                    ? "bg-[var(--accent-green)]/20"
                    : workout
                    ? "active:bg-[var(--bg-secondary)]"
                    : ""
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? "text-[var(--accent-blue)] font-bold"
                      : isFuture
                      ? "text-[var(--text-secondary)] opacity-40"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {day}
                </span>
                {workout && (
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-[var(--bg-card)] border border-[var(--accent-green)]/30 rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-sm">
                {new Date(selectedDay.date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {selectedDay.totalSets} sets
                {selectedDay.groups.length > 0 &&
                  ` · Groups ${selectedDay.groups.join(", ")}`}
              </p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-[var(--text-secondary)] text-lg leading-none active:opacity-60 ml-2"
            >
              ×
            </button>
          </div>
          {selectedDay.exercises.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedDay.exercises.map((ex) => (
                <span
                  key={ex}
                  className="text-xs bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full capitalize"
                >
                  {ex}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent workouts list */}
      {!loading && data && data.workoutDays.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Recent Workouts
          </h3>
          <div className="space-y-2">
            {[...data.workoutDays]
              .reverse()
              .slice(0, 10)
              .map((wd) => (
                <div
                  key={wd.date}
                  className="bg-[var(--bg-card)] border border-white/5 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {new Date(wd.date + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      {wd.groups.length > 0 && (
                        <span className="text-xs text-[var(--text-secondary)]">
                          Group {wd.groups.join(", ")}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[var(--accent-green)] bg-[var(--accent-green)]/10 px-2 py-0.5 rounded-full">
                        {wd.totalSets} sets
                      </span>
                    </div>
                  </div>
                  {wd.exercises.length > 0 && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 capitalize truncate">
                      {wd.exercises.slice(0, 4).join(" · ")}
                      {wd.exercises.length > 4 && ` +${wd.exercises.length - 4} more`}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
