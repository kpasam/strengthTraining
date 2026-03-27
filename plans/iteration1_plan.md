# Strength Training Webapp - Implementation Plan

> **Note:** A detailed, up-to-date checklist for this plan's implementation progress can be found in [`progress_log.md`](file:///Users/kpasam/Code/strengthTraining/plans/progress_log.md). Please update it as steps are completed or if the plan changes.

## Context
Build a personal strength training webapp that pulls daily workout plans from a public Google Slides presentation, displays them in a gym-friendly UI, and lets users quickly log sets with weight/reps. The core goal is **speed of data entry during a set** — minimal taps to log weight and reps.

**Deployment:** Fly.io (free tier, persistent disk for SQLite)
**Sync:** Auto-daily cron (5am) + manual sync button
**Theme:** Dark mode, gym-optimized

---

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** SQLite via `better-sqlite3` + Drizzle ORM
- **Styling:** Tailwind CSS (dark theme)
- **Deployment:** Fly.io with persistent volume
- **Auth:** Simple PIN/password screen (2-3 users, no OAuth needed)

---

## Data Model

### Tables
1. **users** — canonical users logic, tracking `username` and `pin`
2. **exercises** — canonical exercise names (e.g., "bench press", "back squat")
3. **workoutPlans** — one row per date, stores raw slide text + parsed timestamp
4. **workoutGroups** — groups within a plan (A, B, C), with prescribedSets count and sort order
5. **workoutGroupExercises** — exercises in a group, with:
   - `variantFlags` (JSON array: `["pause", "tempo_3_1", "close_grip"]`)
   - `prescribedReps` ("7,5,3,1" or "10")
   - `prescribedNotes` ("work up to heavy single", "moderate")
   - `isAccessory` (true for `*between sets` exercises)
6. **workoutLogs** — logged sets with: userId, date, exerciseId, variantFlags, groupLabel, setNumber, weight, **weightUnit** ("lbs" or "kg"), reps, notes, completedAt

### Exercise Normalization Strategy
- Strip leading rep counts, trailing parenthetical notes
- Detect variant modifiers: "pause", "tempo", "close-grip", "deficit", "w/barbell", "w/DBs"
- Store as canonical name + variant flags array
- This lets "pause bench press" and "bench press" share history but show variant badges

---

## Google Slides Parser

**Fetch:** `GET https://docs.google.com/presentation/d/{ID}/export?format=txt` (follows 307 redirect)

**Parse pipeline:**
1. `fetchSlides.ts` — fetch with redirect following
2. `splitDays.ts` — split text by date pattern regex (`/Monday|Tuesday|.../`)
3. `parseDay.ts` — extract groups (A, B) from each day's text
4. `parseExerciseLine.ts` — extract reps, exercise name, notes from each line
5. `normalizeExercise.ts` — resolve canonical name + variant flags

**Trigger:**
- `POST /api/sync` (manual button)
- Daily cron at 5am via `node-cron`

---

## UI Screens

### Screen 1: Today's Workout (landing page `/`)
- Date header
- Huge **START / RESUME WORKOUT** button that intelligently drops users directly into the first uncompleted Group (starting fresh at Set 1).
- Group cards (A, B, ...) showing exercises and set progress
- Tap a group to enter logging mode
- Sync button in header

### Screen 2: Active Group (`/workout/[groupLabel]`)
- Shows all exercises in the group
- Active exercise highlighted with logging widget:
  - **Previous best** shown (weight x reps, date, variant badge)
  - **Weight input** pre-filled from previous session, with +/- buttons (5lb or 2.5kg depending on active unit)
  - **Unit toggle** — tap "lbs" / "kg" pill next to weight input to switch. Persists per-set so you can mix units across exercises (e.g., barbell area has lb plates, dumbbell area has kg). Last-used unit is remembered per exercise.
  - **Reps input** with +/- 1 buttons
  - **Large LOG SET button** (full width, high contrast). Logging **auto-advances** to the next exercise using round-robin logic.
  - **Notes field** (collapsible)
- Tap other exercises in group to switch or let round-robin switch them automatically
- Set history for current session shown inline, with **Inline Edit/Delete** buttons per-set to adjust mistakes.
- Rest timer auto-starts after logging (dismissible banner)
- Undo toast for accidental logs

### Screen 3: Exercise History (`/history/[exerciseId]`)
- All logged sessions for an exercise
- Variant flags shown as badges
- Personal records highlighted
- Trash icon to Delete accidental past sets directly from the history

### Screen 4: Login (`/login`)
- Simple PIN/Username screen
- Auto-creates new accounts if the username isn't known yet

### Key UX Decisions
- Pre-fill weight **and unit** from most recent session for same exercise
- +/- buttons for quick adjustment (no keyboard needed): **+/- 5 for lbs, +/- 2.5 for kg**
- **Unit toggle (lbs/kg)** is a small tappable pill next to the weight field — one tap to switch. Each exercise remembers its last-used unit independently (stored in localStorage). No global conversion — weights are logged in whatever unit the plates are marked in.
- Previous best displays in the unit it was logged in. If mixed (some sessions lbs, some kg), both are shown.
- No confirmation modals — instant save with undo toast
- Dark theme with large touch targets (min 48px)

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, dark theme, mobile viewport
│   ├── page.tsx                # Today's workout landing
│   ├── globals.css             # Tailwind + dark theme
│   ├── workout/[groupLabel]/
│   │   └── page.tsx            # Active group logging
│   ├── history/[exerciseId]/
│   │   └── page.tsx            # Exercise history
│   └── api/
│       ├── sync/route.ts       # POST: fetch & parse slides
│       ├── workout/today/route.ts  # GET: today's plan
│       ├── log/route.ts        # POST: log set, DELETE: undo
│       └── history/[exerciseId]/route.ts
├── db/
│   ├── index.ts                # SQLite connection
│   └── schema.ts               # Drizzle schema
├── lib/
│   ├── parser/
│   │   ├── fetchSlides.ts
│   │   ├── splitDays.ts
│   │   ├── parseDay.ts
│   │   ├── parseExerciseLine.ts
│   │   └── normalizeExercise.ts
│   └── queries/
│       ├── getPlanForDate.ts
│       ├── logSet.ts
│       ├── getPreviousBest.ts
│       └── getExerciseHistory.ts
├── components/
│   ├── WorkoutGroupCard.tsx
│   ├── ExerciseLogger.tsx      # Core logging widget
│   ├── ExerciseCard.tsx
│   ├── WeightInput.tsx         # +/- buttons (5lb or 2.5kg) with unit toggle pill
│   ├── RepInput.tsx            # +/- 1 buttons
│   ├── PreviousBest.tsx
│   ├── SetHistory.tsx
│   ├── RestTimer.tsx
│   ├── UndoToast.tsx
│   ├── SyncButton.tsx
│   └── VariantBadge.tsx
└── hooks/
    ├── useWorkout.ts
    └── useRestTimer.ts
```

---

## Implementation Order

### Phase 1: Project Setup
1. Init Next.js with TypeScript + Tailwind
2. Install deps: `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, `node-cron`
3. Define DB schema, run migration
4. Set up dark theme in globals.css

### Phase 2: Parser
5. Build all parser modules (fetchSlides → splitDays → parseDay → normalizeExercise)
6. Wire up `POST /api/sync`
7. Test against real slides content, iterate on edge cases

### Phase 3: Core API + Queries
8. Build query helpers (getPlanForDate, logSet, getPreviousBest, getExerciseHistory)
9. Wire up all API routes

### Phase 4: UI
10. Landing page with group cards
11. Active group page with ExerciseLogger
12. WeightInput/RepInput with +/- buttons
13. PreviousBest display
14. UndoToast, RestTimer
15. Exercise history page

### Phase 5: Polish & Deploy
16. PWA manifest for home screen install
17. Daily sync cron setup
18. Fly.io deployment config (Dockerfile, fly.toml, persistent volume)

### Phase 6: Multi-User & UX Polish
19. Multi-User login/middleware setup (Users table)
20. Inline Set Editing / Set Deleting mechanism
21. Round-Robin auto-switching mechanics + Home Start Button

### Phase 7: AI Coach, Timezones & Data Portability
22. **LLM Coach Integration:** Auto-generated hype intros ("theme of the day") and fast post-workout summaries (highlighting PRs + time-of-day dynamic sign-offs).
23. **Timezone Fixes:** Force Pacific Time (`America/Los_Angeles`) across the app so the calendar date is accurate.
24. **Auto-Full Sync:** Trigger a complete historic pull of all slides automatically when a new user signs up.
25. **Data Export:** Add `/api/export` to download personal workout logs as CSV.

### Phase 8: Analytics & History Views
26. **Exercise PR Table (`/exercises`):** Table view of every unique exercise the user has done, showing personal record (highest weight × reps), date achieved, total sessions, and total sets. Sortable by name / PR / sessions. Tapping any row goes to the full exercise history.
27. **Calendar View (`/calendar`):** Monthly calendar with green dots on workout days. Summary stats strip: workouts this week, this year, all time. Tap a day to see inline detail (groups, sets, exercises). Recent workouts list below the calendar. Month navigation arrows.
28. **Bottom Navigation Bar:** Persistent tab bar (`/`, `/exercises`, `/calendar`) hidden on active workout and login pages. Uses `next/navigation` `usePathname` to highlight the active tab.

---

## Verification
1. Run `npm run dev` and open on mobile
2. Hit sync button → verify slides are parsed and today's workout appears
3. Tap into a group → verify exercises show with prescribed reps
4. Log a set → verify it saves and shows in set history
5. Navigate back and re-enter → verify previous best shows correctly (with correct unit)
5a. Log a set in kg, switch to lbs for another exercise → verify each remembers its unit
6. Test variant detection: exercises with "pause" or "tempo" should show badges
7. Test undo toast after logging
8. Run sync again → verify it doesn't duplicate data (upsert behavior)
