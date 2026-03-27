import { describe, it, expect, vi, beforeEach } from 'vitest'
import { splitDays, parseDateString } from './splitDays'

describe('splitDays', () => {
  it('correctly splits text into days based on date headers', () => {
    const text = `
Monday, Mar. 25th
A. Bench press: 7, 5, 3, 1
B. Squat: 10, 10

Wednesday, Mar 27
A. Deadlift: 5, 5, 5
    `
    const days = splitDays(text)
    expect(days).toHaveLength(2)
    expect(days[0].dateString).toBe('Monday, Mar. 25th')
    expect(days[0].body).toContain('Bench press')
    expect(days[1].dateString).toBe('Wednesday, Mar 27')
    expect(days[1].body).toContain('Deadlift')
  })

  it('handles empty text', () => {
    expect(splitDays('')).toEqual([])
  })
})

describe('parseDateString', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 1)) // March 1, 2026
  })

  it('parses valid date string correctly', () => {
    const raw = 'Tuesday, Mar. 25th'
    const parsed = parseDateString(raw)
    expect(parsed).toBe('2026-03-25')
  })

  it('adjusts year if the date seems far in the future to refer to previous year', () => {
    // If current is March 1, and we pass "Oct. 15", it should be last year (2025) 
    // Wait, the logic is: candidate - now > 6 months.
    // Candidate: Oct 15, 2026. Diff is 7.5 months. So year shouldn't be 2026, it becomes 2025.
    const raw = 'Friday, Oct. 15th'
    const parsed = parseDateString(raw)
    expect(parsed).toBe('2025-10-15')
  })

  it('keeps current year if date is close in the future', () => {
    // Candidate: Apr 15. Diff: 1.5 months
    const raw = 'Wednesday, Apr. 15th'
    const parsed = parseDateString(raw)
    expect(parsed).toBe('2026-04-15')
  })

  it('returns null for invalid dates', () => {
    expect(parseDateString('Not a date')).toBeNull()
  })
})
