import { parseExerciseLine, type ParsedExercise } from "./parseExerciseLine";
import { GoogleGenAI } from "@google/genai";

export interface ParsedGroup {
  label: string;
  prescribedSets: number;
  exercises: ParsedExercise[];
}

export interface ParsedDay {
  groups: ParsedGroup[];
  unparsedLines: string[];
}

const ai = new GoogleGenAI({}); // Auto-discovers process.env.GEMINI_API_KEY

export async function parseDay(body: string): Promise<ParsedDay> {
  try {
    const prompt = `You are a fitness data parser. Parse the following workout day text into JSON.
Return EXACTLY a JSON object natively, with NO markdown formatting, NO triple backticks, and NO conversational text.

Schema:
{
  "groups": [
    {
      "label": "A",
      "prescribedSets": 3,
      "exercises": [
        {
          "normalized": {
            "canonicalName": "bench press",
            "variantFlags": ["pause"]
          },
          "prescribedReps": "7,5,3,1",
          "prescribedNotes": "work up to heavy single",
          "isAccessory": false,
          "rawText": "Original line"
        }
      ]
    }
  ],
  "unparsedLines": []
}

Rules:
1. Identify groups (e.g. A, B, C). Infer 'prescribedSets' from group headers or lists of reps, default to 3.
2. For canonical names, use fully expanded lowercase (e.g. 'dumbbell' instead of 'db', 'romanian deadlift' instead of 'rdl').
3. CRITICAL HEURISTIC: Sometimes a bullet point or text line is NOT an exercise at all! If a line looks like an instruction, descriptive note, or modification describing HOW to perform the exercise above it (e.g., "* Manual Resistance If Youre Comfortable With It ——" or "Rest 1 min"), DO NOT push it as a standalone exercise! Instead, append its text to the 'prescribedNotes' section of the immediately preceding exercise.
4. An exercise is an actual movement that you perform repetitions of (e.g. 'Squat', 'Push Up', 'Floor Wipers').
5. Set isAccessory to true if it indicates it's an auxiliary or 'Between sets' movement (e.g. '* Floor Wipers').

Text to parse:
"""
${body}
"""`;

    const timeoutPromise = new Promise<{ text: string }>((_, reject) =>
      setTimeout(() => reject(new Error("LLM request timeout")), 7000)
    );

    const response = (await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      }),
      timeoutPromise,
    ])) as { text: string };

    const output = response.text || "{}";
    const data = JSON.parse(output) as ParsedDay;
    if (data && Array.isArray(data.groups)) {
      return data;
    }
    throw new Error("Invalid schema from LLM");
  } catch (err) {
    console.error("LLM parser failed, falling back to legacy regex:", err);
    return parseDayLegacy(body);
  }
}

export async function parseDayLegacy(body: string): Promise<ParsedDay> {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const groups: ParsedGroup[] = [];
  const unparsedLines: string[] = [];

  let currentGroup: ParsedGroup | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect group header: "A. Bench press: 7, 5, 3, 1 (...)"
    // or "B. 3 sets:"
    const groupMatch = line.match(/^([A-Z])\.\s+(.*)/);
    if (groupMatch) {
      const label = groupMatch[1];
      const rest = groupMatch[2].trim();

      // Check if the header specifies number of sets: "3 sets:"
      const setsMatch = rest.match(/^(\d+)\s+sets?\s*:?\s*$/i);
      let prescribedSets = 3; // default

      if (setsMatch) {
        prescribedSets = parseInt(setsMatch[1], 10);
        currentGroup = { label, prescribedSets, exercises: [] };
        groups.push(currentGroup);
        continue;
      }

      // The header line itself contains an exercise (e.g., "A. Bench press: 7, 5, 3, 1")
      currentGroup = { label, prescribedSets: 1, exercises: [] };
      groups.push(currentGroup);

      // Parse the rest of the header as an exercise
      const parsed = parseExerciseLine(rest);
      if (parsed) {
        const repEntries = parsed.prescribedReps.split(",").filter(Boolean);
        if (repEntries.length > 1) {
          currentGroup.prescribedSets = repEntries.length;
        }
        currentGroup.exercises.push(parsed);
      }
      continue;
    }

    // Lines starting with * are accessories
    if (line.startsWith("*") && currentGroup) {
      const parsed = parseExerciseLine(line);
      if (parsed) {
        currentGroup.exercises.push(parsed);
      }
      continue;
    }

    // Regular exercise lines within a group
    if (currentGroup) {
      const parsed = parseExerciseLine(line);
      if (parsed) {
        currentGroup.exercises.push(parsed);
      } else {
        unparsedLines.push(line);
      }
      continue;
    }

    // Lines before any group
    unparsedLines.push(line);
  }

  return { groups, unparsedLines };
}
