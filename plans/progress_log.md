# Strength Training Webapp - Progress Log

This file tracks the implementation progress of `iteration1_plan.md`. It allows us to pause and resume work while always knowing what has been completed and what is coming next.

## Status Overview: In Progress

**Currently Working On:** Final full-suite verification after regression hardening across parser, query, API, and core UI feature areas.
**Recent Achievements:** Added focused unit coverage for parser fallback behavior, query helpers, logging mutations, workout/api analytics routes, export responses, and fast-entry UI components.

---

## Detailed Task Checklist

### Phase 1: Project Setup (✅ Completed)
- [x] 1. Init Next.js with TypeScript + Tailwind
- [x] 2. Install deps: `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, `node-cron`
- [x] 3. Define DB schema, run migration
- [x] 4. Set up dark theme in `globals.css`
- [x] Database locking issues addressed and build verified.

### Phase 2: Parser (✅ Completed)
- [x] 5. Build all parser modules (fetchSlides → splitDays → parseDay → normalizeExercise)
- [x] 6. Wire up `POST /api/sync`
- [x] 7. Test against real slides content, iterate on edge cases

### Phase 3: Core API + Queries (✅ Completed)
- [x] 8. Finalize query helpers (`getPlanForDate.ts`, `logSet.ts`, `getPreviousBest.ts`, `getExerciseHistory.ts`)
- [x] 9. Wire up all API routes (`/api/workout/today`, `/api/log`, `/api/history/[exerciseId]`)

### Phase 4: UI (✅ Completed)
- [x] 10. Landing page (`/`) with group cards
- [x] 11. Active group page (`/workout/[groupLabel]`) with ExerciseLogger
- [x] 12. Component: WeightInput/RepInput with +/- buttons
- [x] 13. Component: PreviousBest display
- [x] 14. Components: UndoToast, RestTimer
- [x] 15. Exercise history page (`/history/[exerciseId]`)

### Phase 5: Polish & Deploy (✅ Completed)
- [x] 16. PWA manifest for home screen install
- [x] 17. Daily sync cron setup (`node-cron`)
- [x] 18. Fly.io deployment config (Dockerfile, `fly.toml`, persistent volume)

### Phase 6: Multi-User & UX Enhancements (✅ Completed)
- [x] 19. Add Multi-User Auth via simple PIN mechanism and secure cookies
- [x] 20. Update DB schema with `users` table and link `workoutLogs` to users
- [x] 21. Add Edit/Delete capabilities for existing sets inline and in history
- [x] 22. Implement "START WORKOUT" shortcut button to jump to first incomplete group
- [x] 23. Add Round-Robin Auto-Switching to advance automatically after logging a set

### Phase 7: AI Coach, Fixes & Data Export (✅ Completed)
- [x] 24. Implement LLM intro generation (hype themes) and post-workout summary (PRs + time-of-day phrases).
- [x] 25. Fix UTC vs PST bugs to heavily enforce Pacific Time.
- [x] 26. Implement `.dockerignore` and `DATABASE_PATH` fixes for Fly.io deployment and SQLite persistence.
- [x] 27. Inject `GEMINI_API_KEY` to production environment and configure production LLM usage.
- [x] 28. Auto-Trigger historic full-sync on new account creation using `?full=true`.
- [x] 29. Implement CSV Data Export via `/api/export` directly from dashboard.

### Phase 8: Analytics & History Views (✅ Completed)
- [x] 30. Add `GET /api/exercises/prs` — returns all unique exercises with PR (best weight × reps), date achieved, total sessions, total sets.
- [x] 31. Add `GET /api/calendar` — returns all workout days with exercises/groups/sets, plus `weekCount` and `yearCount` summary stats.
- [x] 32. Add `/exercises` page — sortable table of all exercises with PR display; tap row to open exercise history.
- [x] 33. Add `/calendar` page — monthly calendar with green dots on workout days, stats strip (week/year/all-time), tap-day detail popup, recent workouts list, month navigation.
- [x] 34. Add `BottomNav` component — tab bar with Today / Exercises / Calendar; hidden on `/login`, `/workout/*`, `/history/*` routes.

### Regression Hardening (🚧 In Progress)
- [x] Add parser coverage for day/group parsing fallbacks and tricky line handling.
- [x] Add query-helper coverage for plan hydration, previous-best lookups, history grouping, and log mutations.
- [x] Add API route coverage for workout enrichment, logging flows, analytics summaries, and export/auth edge cases.
- [x] Add focused component coverage for input controls and timer/toast behavior.
- [x] Keep local regression summary logs current after each major test batch.

### Regression Run Summaries
- Parser + query batch: initially failed on fallback parsing of `Rest 1 min`; fixed by rejecting instruction-only lines in `parseExerciseLine`. Rerun passed with 5 test files and 17 tests green.
- API route batch: passed with 5 test files and 14 tests green.
- Component interaction batch: initial harness failures in `BottomNav.test.tsx` and `RestTimer.test.tsx`; fixed mock hoisting and timer `act(...)` usage. Rerun passed with 4 test files and 7 tests green.
- Log mutation helper batch: passed with 1 test file and 2 tests green.

---

## Notes & Open Questions
- **DB Adjustments:** Remember to handle concurrent SQLite access carefully (locking issues previously fixed).
- **UI Details:** Focus heavily on the speed of logging (minimal taps/clicks).
