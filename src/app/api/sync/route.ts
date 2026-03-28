import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { fetchSlidesText } from "@/lib/parser/fetchSlides";
import { splitDays, parseDateString } from "@/lib/parser/splitDays";
import { parseDay } from "@/lib/parser/parseDay";

type Tx = typeof db;

function getOrCreateExercise(tx: Tx, canonicalName: string): number {
  const existing = tx
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.canonicalName, canonicalName))
    .get();

  if (existing) return existing.id;

  const result = tx
    .insert(schema.exercises)
    .values({ canonicalName })
    .returning()
    .get();

  return result.id;
}

export async function POST(req: NextRequest) {
  try {
    const text = await fetchSlidesText();
    const days = splitDays(text);

    let synced = 0;
    let skipped = 0;

    const fullSync = req.nextUrl.searchParams.get("full") === "true";

    const now = new Date();
    // Get yesterday's date cleanly
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayIso = yesterday.toISOString().split("T")[0];

    for (const day of days) {
      const isoDate = parseDateString(day.dateString);
      // ONLY sync today and yesterday (or future). Ignore everything older unless fullSync is true.
      if (!fullSync && (!isoDate || isoDate < yesterdayIso)) {
        skipped++;
        continue;
      }

      const existingPlan = db
        .select()
        .from(schema.workoutPlans)
        .where(eq(schema.workoutPlans.date, isoDate as string))
        .get();

      // If the contents from Google are identical to what we already successfully saved, do not re-issue an LLM hit
      if (existingPlan && existingPlan.rawText === day.body) {
        skipped++;
        continue;
      }

      // Parse first so we don't start a transaction on a bad parse
      const parsed = await parseDay(day.body);
      await new Promise(r => setTimeout(r, 1000)); // Prevent heavy-demand LLM rate limits on large historic syncs

      db.transaction((tx) => {
        // Upsert the plan
        let planId: number;
        if (existingPlan) {
          tx.update(schema.workoutPlans)
            .set({ rawText: day.body, parsedAt: new Date().toISOString() })
            .where(eq(schema.workoutPlans.id, existingPlan.id))
            .run();
          planId = existingPlan.id;

          // Delete non-manual groups (preserve M-prefixed manual groups)
          const oldGroups = tx
            .select({ id: schema.workoutGroups.id, groupLabel: schema.workoutGroups.groupLabel })
            .from(schema.workoutGroups)
            .where(eq(schema.workoutGroups.planId, planId))
            .all();

          for (const og of oldGroups) {
            if (/^M\d+$/.test(og.groupLabel)) continue; // preserve manual groups
            tx.delete(schema.workoutGroupExercises)
              .where(eq(schema.workoutGroupExercises.groupId, og.id))
              .run();
            tx.delete(schema.workoutGroups)
              .where(eq(schema.workoutGroups.id, og.id))
              .run();
          }
        } else {
          const plan = tx
            .insert(schema.workoutPlans)
            .values({
              date: isoDate as string,
              rawText: day.body,
              parsedAt: new Date().toISOString(),
            })
            .returning()
            .get();
          planId = plan.id;
        }

        // Merge groups with the same label to avoid DB constraint failures
        const mergedGroupsMap = new Map<string, typeof parsed.groups[0]>();
        for (const g of parsed.groups) {
          if (!mergedGroupsMap.has(g.label)) {
            mergedGroupsMap.set(g.label, { ...g, exercises: [...g.exercises] });
          } else {
            const existing = mergedGroupsMap.get(g.label)!;
            existing.exercises.push(...g.exercises);
            if (existing.prescribedSets === 3 && g.prescribedSets !== 3) {
              existing.prescribedSets = g.prescribedSets;
            }
          }
        }
        const mergedGroups = Array.from(mergedGroupsMap.values());

        // Insert groups + exercises (Steve's groups come first, sort order starts at 0)
        for (let gi = 0; gi < mergedGroups.length; gi++) {
          const group = mergedGroups[gi];
          const groupRow = tx
            .insert(schema.workoutGroups)
            .values({
              planId,
              groupLabel: group.label,
              prescribedSets: group.prescribedSets,
              sortOrder: gi,
            })
            .returning()
            .get();

          for (let ei = 0; ei < group.exercises.length; ei++) {
            const ex = group.exercises[ei];
            const exerciseId = getOrCreateExercise(tx, ex.normalized.canonicalName);

            tx.insert(schema.workoutGroupExercises)
              .values({
                groupId: groupRow.id,
                exerciseId,
                variantFlags: JSON.stringify(ex.normalized.variantFlags),
                prescribedReps: ex.prescribedReps,
                prescribedNotes: ex.prescribedNotes,
                isAccessory: ex.isAccessory,
                sortOrder: ei,
              })
              .run();
          }
        }
      });

      synced++;
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      totalDays: days.length,
    });
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
