export interface RawDay {
  dateString: string;
  body: string;
}

const DATE_PATTERN =
  /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?/gi;

export function splitDays(text: string): RawDay[] {
  const matches = [...text.matchAll(DATE_PATTERN)];
  if (matches.length === 0) return [];

  const days: RawDay[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const body = text.slice(start, end).trim();

    days.push({
      dateString: match[0].trim(),
      body,
    });
  }

  return days;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parseDateString(dateStr: string): string | null {
  // "Tuesday, Mar. 25th" => "2026-03-25"
  const match = dateStr.match(
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})/i
  );
  if (!match) return null;

  const monthStr = dateStr.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
  );
  if (!monthStr) return null;

  const month = MONTH_MAP[monthStr[1].toLowerCase()];
  const day = parseInt(match[1], 10);

  // Determine year: use current year, but if the date is far in the past, use next year
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, month, day);

  // If the date is more than 6 months in the future, it's probably last year
  if (candidate.getTime() - now.getTime() > 6 * 30 * 24 * 60 * 60 * 1000) {
    year--;
  }

  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}
