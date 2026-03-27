const VARIANT_PATTERNS: [RegExp, string][] = [
  [/\bpause\b/i, "pause"],
  [/\btempo\s*[\(\[]?\s*(\d+[\/]\d+)\s*[\)\]]?/i, "tempo"],
  [/\bclose[- ]?grip\b/i, "close_grip"],
  [/\bwide[- ]?grip\b/i, "wide_grip"],
  [/\bdeficit\b/i, "deficit"],
  [/\bsumo\b/i, "sumo"],
  [/\boverhead\b/i, "overhead"],
  [/\bincline\b/i, "incline"],
  [/\bdecline\b/i, "decline"],
  [/\bseated\b/i, "seated"],
  [/\bstanding\b/i, "standing"],
  [/\bsingle[- ]?leg\b/i, "single_leg"],
  [/\bsingle[- ]?arm\b/i, "single_arm"],
  [/\balternating\b/i, "alternating"],
];

const EQUIPMENT_PATTERNS: [RegExp, string][] = [
  [/\bw\/?barbell\b|\bw\/ barbell\b|\bbarbell\b/i, "barbell"],
  [/\bw\/?DB[s]?\b|\bw\/ DB[s]?\b|\bdumbbell[s]?\b|\bDB[s]?\b/i, "dumbbell"],
  [/\bw\/?KB[s]?\b|\bw\/ KB[s]?\b|\bkettlebell[s]?\b|\bKB[s]?\b/i, "kettlebell"],
  [/\bband[s]?\b/i, "band"],
  [/\bcable\b/i, "cable"],
  [/\bplate\b/i, "plate"],
  [/\bsled\b/i, "sled"],
];

const ALIASES: Record<string, string> = {
  "bench": "bench press",
  "bp": "bench press",
  "squat": "back squat",
  "squats": "back squat",
  "back squats": "back squat",
  "front squats": "front squat",
  "dl": "deadlift",
  "deadlifts": "deadlift",
  "rdl": "romanian deadlift",
  "rdls": "romanian deadlift",
  "ohp": "overhead press",
  "push up": "push up",
  "pushups": "push up",
  "pushup": "push up",
  "pull ups": "pull up",
  "pullups": "pull up",
  "pullup": "pull up",
  "sit ups": "sit up",
  "situps": "sit up",
  "situp": "sit up",
  "y raises": "y raise",
  "upright rows": "upright row",
};

export interface NormalizedExercise {
  canonicalName: string;
  variantFlags: string[];
  equipment: string | null;
}

export function normalizeExercise(rawName: string): NormalizedExercise {
  let name = rawName.trim();
  const variantFlags: string[] = [];
  let equipment: string | null = null;

  // Extract variant flags
  for (const [pattern, flag] of VARIANT_PATTERNS) {
    if (pattern.test(name)) {
      variantFlags.push(flag);
      name = name.replace(pattern, "").trim();
    }
  }

  // Extract equipment
  for (const [pattern, equip] of EQUIPMENT_PATTERNS) {
    if (pattern.test(name)) {
      equipment = equip;
      name = name.replace(pattern, "").trim();
    }
  }

  // Clean up
  name = name
    .replace(/\s+/g, " ")
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase();

  // Remove trailing 's' for plurals (simple singularization)
  if (name.endsWith("es") && !name.endsWith("raises") && !name.endsWith("presses")) {
    // maybe we meant to remove 'es', but for now let's just do nothing
  } else if (name.endsWith("s") && !name.endsWith("ss") && !name.endsWith("press") && !name.endsWith("presses")) {
    name = name.slice(0, -1);
  }

  // Apply aliases
  if (ALIASES[name]) {
    name = ALIASES[name];
  }

  // Add equipment as variant if relevant
  if (equipment && !["barbell"].includes(equipment)) {
    variantFlags.push(`with_${equipment}`);
  }

  return {
    canonicalName: name,
    variantFlags,
    equipment,
  };
}
