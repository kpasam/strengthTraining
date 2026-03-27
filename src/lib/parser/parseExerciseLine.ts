import { normalizeExercise, type NormalizedExercise } from "./normalizeExercise";

export interface ParsedExercise {
  normalized: NormalizedExercise;
  prescribedReps: string;
  prescribedNotes: string;
  isAccessory: boolean;
  rawText: string;
}

export function parseExerciseLine(line: string): ParsedExercise | null {
  let text = line.trim();
  if (!text || text.length < 3) return null;

  if (/^(rest|warm\s*up|cool\s*down)\b/i.test(text)) {
    return null;
  }

  const isAccessory = text.startsWith("*");
  if (isAccessory) {
    text = text.slice(1).trim();
  }

  // Extract parenthetical notes: (moderate), (heavy), (work up to heavy single)
  const notesMatch = text.match(/\(([^)]+)\)/g);
  const prescribedNotes = notesMatch
    ? notesMatch.map((n) => n.slice(1, -1)).join("; ")
    : "";
  let cleaned = text.replace(/\(([^)]+)\)/g, "").trim();

  // Try to extract rep scheme like "7, 5, 3, 1" after a colon
  let prescribedReps = "";
  const colonScheme = cleaned.match(/:\s*([\d,\s]+)/);
  if (colonScheme) {
    prescribedReps = colonScheme[1].replace(/\s+/g, "").trim();
    cleaned = cleaned.replace(/:\s*[\d,\s]+/, "").trim();
  }

  // Try to extract leading rep count: "10 push press" or "12 bent-over Y raises"
  if (!prescribedReps) {
    const leadingReps = cleaned.match(/^(\d+)\s+(?:each\s+(?:side|leg|arm)\s+)?/i);
    if (leadingReps) {
      prescribedReps = leadingReps[1];
      const eachMatch = cleaned.match(/^(\d+)\s+(each\s+(?:side|leg|arm))\s+/i);
      if (eachMatch) {
        prescribedReps = `${eachMatch[1]} each`;
        cleaned = cleaned.slice(eachMatch[0].length).trim();
      } else {
        cleaned = cleaned.slice(leadingReps[0].length).trim();
      }
    }
  }

  // Try time-based: "20sec", "30 sec", "1 min"
  if (!prescribedReps) {
    const timeMatch = cleaned.match(/(\d+)\s*(?:sec|min|seconds?|minutes?)/i);
    if (timeMatch) {
      prescribedReps = timeMatch[0].trim();
      cleaned = cleaned.replace(timeMatch[0], "").trim();
    }
  }

  // Extract "between each working set" / "between sets" markers
  const betweenSetsMatch = cleaned.match(/between\s+(?:each\s+)?(?:working\s+)?set[s]?/i);
  let isBetweenSets = false;
  if (betweenSetsMatch) {
    isBetweenSets = true;
    cleaned = cleaned.replace(betweenSetsMatch[0], "").trim();
  }

  if (!cleaned) return null;

  const normalized = normalizeExercise(cleaned);

  return {
    normalized,
    prescribedReps: prescribedReps || "—",
    prescribedNotes,
    isAccessory: isAccessory || isBetweenSets,
    rawText: line.trim(),
  };
}
