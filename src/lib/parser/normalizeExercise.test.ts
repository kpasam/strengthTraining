import { describe, it, expect } from 'vitest'
import { normalizeExercise } from './normalizeExercise'

describe('normalizeExercise', () => {
  it('extracts canonical names and aliases correctly', () => {
    expect(normalizeExercise('bench').canonicalName).toBe('bench press')
    expect(normalizeExercise('bp').canonicalName).toBe('bench press')
    expect(normalizeExercise('squat').canonicalName).toBe('back squat')
    expect(normalizeExercise('back squats').canonicalName).toBe('back squat')
    expect(normalizeExercise('rdls').canonicalName).toBe('romanian deadlift')
  })

  it('extracts variant flags', () => {
    const res = normalizeExercise('pause bench press')
    expect(res.canonicalName).toBe('bench press')
    expect(res.variantFlags).toContain('pause')

    const res2 = normalizeExercise('tempo 3/1 front squats')
    expect(res2.canonicalName).toBe('front squat')
    expect(res2.variantFlags).toContain('tempo')
  })

  it('extracts equipment patterns and assigns correctly', () => {
    const res = normalizeExercise('DB bench press')
    expect(res.canonicalName).toBe('bench press')
    expect(res.equipment).toBe('dumbbell')
    expect(res.variantFlags).toContain('with_dumbbell')

    const res2 = normalizeExercise('sled push')
    expect(res2.canonicalName).toBe('push') // since sled is equipment
    expect(res2.equipment).toBe('sled')
    expect(res2.variantFlags).toContain('with_sled')

    const res3 = normalizeExercise('barbell back squat')
    expect(res3.canonicalName).toBe('back squat')
    expect(res3.equipment).toBe('barbell')
    // barbell is the default, so it might not add with_barbell to variant flags 
    expect(res3.variantFlags).not.toContain('with_barbell')
  })

  it('cleans up names correctly', () => {
    const res = normalizeExercise('The Bulgarian Split Squat')
    expect(res.canonicalName).toBe('bulgarian split squat')
  })

  it('removes trailing s except for specific words', () => {
    expect(normalizeExercise('pushups').canonicalName).toBe('push up') // aliased
    // what about non-aliased plurals: rows -> row
    expect(normalizeExercise('rows').canonicalName).toBe('row')
    expect(normalizeExercise('presses').canonicalName).toBe('presses') // "presses" ends with es, not singularized as per rule
  })
})
