import type Database from "better-sqlite3";

interface Label {
  bodyPart: string;
  intensity: string;
  movementType: string;
  equipment: string;
  exerciseType?: "strength" | "timed";
}

export const EXERCISE_LABELS: Record<string, Label> = {
  "ab wheel":                          { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "bodyweight" },
  "alt front rack reverse lunges":     { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "alt gorilla row":                   { bodyPart: "back",      intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "alt hanging kneeleg raise":         { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "bodyweight" },
  "alt lunges":                        { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "alt oblique sit up":                { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "bodyweight" },
  "alt plank row":                     { bodyPart: "core",      intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "alt thread the needle":             { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "bodyweight" },
  "alt twist":                         { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "bodyweight" },
  "alt walking lunges":                { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "alternating dumbbell plank rows":   { bodyPart: "core",      intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "alternating front rack reverse lunge": { bodyPart: "legs",   intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "alternating oblique sit up":        { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "bodyweight" },
  "alternating plate twists":          { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "plate" },
  "alternating walking lunges":        { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "b-stance romanian deadlift":        { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "back squat":                        { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "ball slam":                         { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "dumbbell" },
  "behind-the-neck tricep extension":  { bodyPart: "arms",      intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "bench pistol squat":                { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "bodyweight" },
  "bench press":                       { bodyPart: "chest",     intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "bent-over one arm rear delt fly":   { bodyPart: "shoulders", intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "bent-over one arm rear delt fly wnegative": { bodyPart: "shoulders", intensity: "low", movementType: "isolation", equipment: "dumbbell" },
  "bent-over rear delt flies wnegative": { bodyPart: "shoulders", intensity: "low",    movementType: "isolation", equipment: "dumbbell" },
  "bent-over row":                     { bodyPart: "back",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "bent-over rows wrotation":          { bodyPart: "back",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "bent-over y raise":                 { bodyPart: "shoulders", intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "bent-over y raises":                { bodyPart: "shoulders", intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "bicep curl":                        { bodyPart: "arms",      intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "bicep curls wnegative":             { bodyPart: "arms",      intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "bulgarian split squat":             { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "dumbbell" },
  "burpees":                           { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "bodyweight" },
  "close grip dumbbell bench press":   { bodyPart: "chest",     intensity: "high",     movementType: "compound",  equipment: "dumbbell" },
  "contralateral loaded split squat":  { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "dumbbell" },
  "crossover step up":                 { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "deadlift":                          { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "dip":                               { bodyPart: "chest",     intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "dumbbell hang power clean":         { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "dumbbell" },
  "floor wipers":                      { bodyPart: "core",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "forward to reverse curtsy lunges":  { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "front raises wnegative":            { bodyPart: "shoulders", intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "front squat":                       { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "full turkish":                      { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "kettlebell" },
  "good morning":                      { bodyPart: "back",      intensity: "moderate", movementType: "compound",  equipment: "barbell" },
  "half-kneeling press":               { bodyPart: "shoulders", intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "half-kneeling windmill":            { bodyPart: "core",      intensity: "moderate", movementType: "compound",  equipment: "kettlebell" },
  "hang muscle clean":                 { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "hollow rock":                       { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "bodyweight" },
  "hover deadlift":                    { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "lateral plank walk":                { bodyPart: "core",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "lateral raise":                     { bodyPart: "shoulders", intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "lateral raises wnegative":          { bodyPart: "shoulders", intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "leg lift wnegative":                { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "bodyweight" },
  "leg lifts wnegative":               { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "bodyweight" },
  "max effort chin up":                { bodyPart: "back",      intensity: "high",     movementType: "compound",  equipment: "bodyweight" },
  "max effort pull up":                { bodyPart: "back",      intensity: "high",     movementType: "compound",  equipment: "bodyweight" },
  "medball pikes":                     { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "dumbbell" },
  "muscle clean to press":             { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "one-arm hang muscle snatch":        { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "dumbbell" },
  "one-arm muscle snatch":             { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "dumbbell" },
  "one-arm row":                       { bodyPart: "back",      intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "one-leg rdl":                       { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "one-leg romanian deadlift":         { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "partner assisted chin up":          { bodyPart: "back",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "partner assisted pull up":          { bodyPart: "back",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "pendlay row":                       { bodyPart: "back",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "plank rows":                        { bodyPart: "core",      intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "plate sit up":                      { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "plate" },
  "plate sit-ups":                     { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "plate" },
  "plate twists":                      { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "plate" },
  "press":                             { bodyPart: "shoulders", intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "pull up":                           { bodyPart: "back",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "push press":                        { bodyPart: "shoulders", intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "reverse drag":                      { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "sled" },
  "romanian deadlift":                 { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "rope pull":                         { bodyPart: "back",      intensity: "moderate", movementType: "compound",  equipment: "cable" },
  "run":                               { bodyPart: "full_body", intensity: "moderate", movementType: "compound",  equipment: "bodyweight", exerciseType: "timed" },
  "seated barbell shoulder press":     { bodyPart: "shoulders", intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "seated vertical jumps":             { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "shoulder press":                    { bodyPart: "shoulders", intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "side bend":                         { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "dumbbell" },
  "side plank thread the needle":      { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "bodyweight" },
  "sit up":                            { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "bodyweight" },
  "sliding lateral lunges":            { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "sliding pikes":                     { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "bodyweight" },
  "split squat":                       { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "squat thrust":                      { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "bodyweight" },
  "standing sled rope pull":           { bodyPart: "back",      intensity: "moderate", movementType: "compound",  equipment: "sled" },
  "straight arm push":                 { bodyPart: "chest",     intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "suitcase carry":                    { bodyPart: "core",      intensity: "moderate", movementType: "compound",  equipment: "dumbbell" },
  "suitcase deadlift":                 { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "dumbbell" },
  "tempo b stance rdl":                { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "tempo back squat":                  { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "tempo bent-over row":               { bodyPart: "back",      intensity: "high",     movementType: "compound",  equipment: "barbell" },
  "turkish get down":                  { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "kettlebell" },
  "twist":                             { bodyPart: "core",      intensity: "low",      movementType: "isolation", equipment: "bodyweight" },
  "upright row":                       { bodyPart: "shoulders", intensity: "moderate", movementType: "compound",  equipment: "barbell" },
  "upright rows":                      { bodyPart: "shoulders", intensity: "moderate", movementType: "compound",  equipment: "barbell" },
  "v-up":                              { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "bodyweight" },
  "vertical jump":                     { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "bodyweight" },
  "vertical jumps":                    { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "bodyweight" },
  "walking lunges":                    { bodyPart: "legs",      intensity: "moderate", movementType: "compound",  equipment: "bodyweight" },
  "weighted bear crawl":               { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "plate" },
  "weighted duck walk":                { bodyPart: "legs",      intensity: "high",     movementType: "compound",  equipment: "dumbbell" },
  "wood chop":                         { bodyPart: "core",      intensity: "moderate", movementType: "compound",  equipment: "cable" },
  "z press":                           { bodyPart: "shoulders", intensity: "moderate", movementType: "compound",  equipment: "barbell" },
  "5k run":                            { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "bodyweight", exerciseType: "timed" },
  "200m run":                          { bodyPart: "full_body", intensity: "moderate", movementType: "compound",  equipment: "bodyweight", exerciseType: "timed" },
  "400m run":                          { bodyPart: "full_body", intensity: "high",     movementType: "compound",  equipment: "bodyweight", exerciseType: "timed" },
  "1min march":                        { bodyPart: "core",      intensity: "low",      movementType: "compound",  equipment: "bodyweight" },
  "1min of high-low plank":            { bodyPart: "core",      intensity: "moderate", movementType: "isolation", equipment: "bodyweight" },
};

const GARBAGE_PATTERNS = [
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  /\bmake sure\b/i,
  /\beach rep\b/i,
  /\bfocus on\b/i,
  /\bcan stick to\b/i,
  /\bstart from\b/i,
  /\bif too\b/i,
  /\bif youre\b/i,
  /\bbeginners\b/i,
  /\blets see\b/i,
  /\bcontrol the\b/i,
  /\bbetween each\b/i,
  /\beach side between\b/i,
  /\beach arm between\b/i,
  /\bhardest progression\b/i,
  /\buse benches\b/i,
  /\bweight in goblet\b/i,
  /\bfront rack or\b/i,
  /\bsec at chest\b/i,
  /\bsec bird dog\b/i,
  /\bsec pull up hold\b/i,
  /\bsec side plank\b/i,
  /\bsec t pose\b/i,
  /\bsec tuckl\b/i,
  /\bpress\s+sled\b/i,
  /\bpull up hold\b/i,
  /\bhang muscle clean or\b/i,
  /\bsit ups\s+\d+\b/i,
  /\bsv rugby\b/i,
  /\bpush$/i,
  /\b\d+\s*plate twist\b/i,
];

function isGarbage(name: string): boolean {
  if (name.length > 60) return true;
  return GARBAGE_PATTERNS.some((p) => p.test(name));
}

export function seedExerciseLabels(sqlite: InstanceType<typeof Database>): void {
  const insertExercise = sqlite.prepare(`
    INSERT INTO exercises (canonical_name) VALUES (?)
    ON CONFLICT(canonical_name) DO NOTHING
  `);

  const upsertLabel = sqlite.prepare(`
    INSERT INTO exercise_labels (exercise_id, is_exercise, body_part, intensity, movement_type, equipment, exercise_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(exercise_id) DO UPDATE SET
      is_exercise = excluded.is_exercise,
      body_part = excluded.body_part,
      intensity = excluded.intensity,
      movement_type = excluded.movement_type,
      equipment = excluded.equipment,
      exercise_type = excluded.exercise_type
  `);

  const tx = sqlite.transaction(() => {
    // Ensure all known exercises exist in the exercises table
    for (const name of Object.keys(EXERCISE_LABELS)) {
      insertExercise.run(name);
    }

    // Now label all exercises in the table
    const exercises = sqlite
      .prepare("SELECT id, canonical_name FROM exercises ORDER BY canonical_name")
      .all() as { id: number; canonical_name: string }[];

    for (const ex of exercises) {
      const label = EXERCISE_LABELS[ex.canonical_name];
      if (label) {
        upsertLabel.run(ex.id, 1, label.bodyPart, label.intensity, label.movementType, label.equipment, label.exerciseType || "strength");
      } else if (isGarbage(ex.canonical_name)) {
        upsertLabel.run(ex.id, 0, null, null, null, null, "strength");
      } else {
        upsertLabel.run(ex.id, 1, null, null, null, null, "strength");
      }
    }
  });

  tx();
}
