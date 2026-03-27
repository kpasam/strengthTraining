import { describe, it, expect } from 'vitest'
import { parseExerciseLine } from './parseExerciseLine'

describe('parseExerciseLine', () => {
  it('parses a standard exercise line with colon rep scheme', () => {
    const parsed = parseExerciseLine('Bench press: 7, 5, 3, 1 (work up to heavy single)')
    expect(parsed).not.toBeNull()
    expect(parsed!.prescribedReps).toBe('7,5,3,1')
    expect(parsed!.prescribedNotes).toBe('work up to heavy single')
    expect(parsed!.isAccessory).toBe(false)
    expect(parsed!.normalized.canonicalName).toBe('bench press')
  })

  it('parses a leading rep count', () => {
    const parsed = parseExerciseLine('10 push press')
    expect(parsed).not.toBeNull()
    expect(parsed!.prescribedReps).toBe('10')
    expect(parsed!.normalized.canonicalName).toBe('push press')
  })

  it('parses a leading rep count with each side', () => {
    const parsed = parseExerciseLine('12 each leg bulgarian split squat')
    expect(parsed).not.toBeNull()
    expect(parsed!.prescribedReps).toBe('12 each')
    expect(parsed!.normalized.canonicalName).toBe('bulgarian split squat')
  })

  it('identifies accessory exercises starting with *', () => {
    const parsed = parseExerciseLine('* 20sec planks (weighted)')
    expect(parsed).not.toBeNull()
    expect(parsed!.isAccessory).toBe(true)
    expect(parsed!.prescribedReps).toBe('20sec')
    expect(parsed!.prescribedNotes).toBe('weighted')
    expect(parsed!.normalized.canonicalName).toBe('plank')
  })

  it('identifies between sets accessory exercises', () => {
    const parsed = parseExerciseLine('10 Pull ups between each working set')
    expect(parsed).not.toBeNull()
    expect(parsed!.isAccessory).toBe(true)
    expect(parsed!.prescribedReps).toBe('10')
    expect(parsed!.normalized.canonicalName).toBe('pull up') // pull ups normalized to pull up
  })

  it('returns null for empty or very short lines', () => {
    expect(parseExerciseLine('')).toBeNull()
    expect(parseExerciseLine('A')).toBeNull()
  })

  it('returns null for instruction-only lines', () => {
    expect(parseExerciseLine('Rest 1 min')).toBeNull()
    expect(parseExerciseLine('Warm up thoroughly')).toBeNull()
  })
})
