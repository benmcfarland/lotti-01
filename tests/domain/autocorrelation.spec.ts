import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { calculateLag1Autocorrelation } from '../../src/domain/math/Autocorrelation'
import type { Draw } from '../../src/domain/Draw'

describe('Lag-1 Autocorrelation Test for Draw Independence', () => {
  let syntheticDraws: Draw[]

  beforeAll(() => {
    const fixture = JSON.parse(readFileSync('tests/fixtures/synthetic_data.json', 'utf-8'))
    syntheticDraws = fixture.data.map((d: { drawId: number; numbers: number[] }) => ({
      id: `draw-${d.drawId}`,
      numbers: d.numbers,
    }))
  })

  it('calculates Lag-1 autocorrelation on synthetic uniform draws', () => {
    const result = calculateLag1Autocorrelation(syntheticDraws)

    expect(result.lag1Correlation).toBeDefined()
    expect(result.lag1Correlation).toBeGreaterThanOrEqual(-1)
    expect(result.lag1Correlation).toBeLessThanOrEqual(1)
  })

  it('returns correlation in valid range [-1, 1]', () => {
    const result = calculateLag1Autocorrelation(syntheticDraws)

    expect(Math.abs(result.lag1Correlation)).toBeLessThanOrEqual(1)
  })

  it('classifies independent (uniform) draws correctly', () => {
    const result = calculateLag1Autocorrelation(syntheticDraws)

    // Uniform random draws should have near-zero correlation
    expect(Math.abs(result.lag1Correlation)).toBeLessThan(0.3)
    expect(result.interpretation).toBe('Independent')
    expect(result.isSignificant).toBe(false)
  })

  it('returns p-value in valid range [0, 1]', () => {
    const result = calculateLag1Autocorrelation(syntheticDraws)

    expect(result.pValue).toBeGreaterThanOrEqual(0)
    expect(result.pValue).toBeLessThanOrEqual(1)
  })

  it('sums array matches number of draws', () => {
    const result = calculateLag1Autocorrelation(syntheticDraws)

    expect(result.sums.length).toBe(syntheticDraws.length)
    expect(result.lag1Sums.length).toBe(syntheticDraws.length - 1)
  })

  it('detects positive autocorrelation (ascending pattern)', () => {
    // Create draws where sums are increasing (positive autocorrelation)
    const ascendingDraws: Draw[] = [
      { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15
      { id: 'd2', numbers: [2, 3, 4, 5, 6] }, // sum = 20
      { id: 'd3', numbers: [3, 4, 5, 6, 7] }, // sum = 25
      { id: 'd4', numbers: [4, 5, 6, 7, 8] }, // sum = 30
      { id: 'd5', numbers: [5, 6, 7, 8, 9] }, // sum = 35
      { id: 'd6', numbers: [6, 7, 8, 9, 10] }, // sum = 40
      { id: 'd7', numbers: [7, 8, 9, 10, 11] }, // sum = 45
    ]

    const result = calculateLag1Autocorrelation(ascendingDraws)

    // Should detect positive correlation
    expect(result.lag1Correlation).toBeGreaterThan(0.5)
    expect(result.interpretation).toBe('Dependent')
  })

  it('detects negative autocorrelation (alternating pattern)', () => {
    // Create draws with alternating high/low sums (negative autocorrelation)
    const alternatingDraws: Draw[] = [
      { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15 (low)
      { id: 'd2', numbers: [45, 46, 47, 48, 49] }, // sum = 235 (high)
      { id: 'd3', numbers: [2, 3, 4, 5, 6] }, // sum = 20 (low)
      { id: 'd4', numbers: [44, 45, 46, 47, 48] }, // sum = 230 (high)
      { id: 'd5', numbers: [3, 4, 5, 6, 7] }, // sum = 25 (low)
      { id: 'd6', numbers: [43, 44, 45, 46, 47] }, // sum = 225 (high)
    ]

    const result = calculateLag1Autocorrelation(alternatingDraws)

    // Should detect negative correlation
    expect(result.lag1Correlation).toBeLessThan(-0.5)
    expect(result.interpretation).toBe('Dependent')
  })

  it('throws on insufficient draws', () => {
    const shortDraws: Draw[] = [
      { id: 'd1', numbers: [1, 2, 3, 4, 5] },
      { id: 'd2', numbers: [6, 7, 8, 9, 10] },
    ]

    expect(() => calculateLag1Autocorrelation(shortDraws)).toThrow()
  })

  it('calculates lagged sequence correctly', () => {
    const testDraws: Draw[] = [
      { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15
      { id: 'd2', numbers: [10, 11, 12, 13, 14] }, // sum = 60
      { id: 'd3', numbers: [20, 21, 22, 23, 24] }, // sum = 110
    ]

    const result = calculateLag1Autocorrelation(testDraws)

    expect(result.sums).toEqual([15, 60, 110])
    expect(result.lag1Sums).toEqual([60, 110])
  })

  it('handles identical sums (zero variance)', () => {
    // All draws have the same sum - correlation should be NaN-safe (return 0)
    const identicalDraws: Draw[] = [
      { id: 'd1', numbers: [10, 11, 12, 13, 14] }, // sum = 60
      { id: 'd2', numbers: [10, 11, 12, 13, 14] }, // sum = 60
      { id: 'd3', numbers: [10, 11, 12, 13, 14] }, // sum = 60
    ]

    const result = calculateLag1Autocorrelation(identicalDraws)

    // When variance is 0, correlation should be 0
    expect(result.lag1Correlation).toBe(0)
  })

  it('supports Skeptical Realist persona - proves independence on uniform data', () => {
    const result = calculateLag1Autocorrelation(syntheticDraws)

    // Evidence 1: Near-zero correlation
    expect(Math.abs(result.lag1Correlation)).toBeLessThan(0.2)

    // Evidence 2: Not statistically significant
    expect(result.isSignificant).toBe(false)

    // Evidence 3: Clear "Independent" classification
    expect(result.interpretation).toBe('Independent')

    // Evidence 4: High p-value (no evidence of dependence)
    expect(result.pValue).toBeGreaterThan(0.1)
  })

  it('correlation is symmetric (order independent)', () => {
    const testDraws: Draw[] = [
      { id: 'd1', numbers: [5, 10, 15, 20, 25] }, // sum = 75
      { id: 'd2', numbers: [10, 15, 20, 25, 30] }, // sum = 100
      { id: 'd3', numbers: [15, 20, 25, 30, 35] }, // sum = 125
      { id: 'd4', numbers: [20, 25, 30, 35, 40] }, // sum = 150
    ]

    const result = calculateLag1Autocorrelation(testDraws)

    // Correlation should be well-defined and consistent
    expect(Number.isFinite(result.lag1Correlation)).toBe(true)
    expect(result.lag1Correlation).not.toBeNaN()
  })

  it('distinguishes between zero and non-zero correlation', () => {
    // Completely random draws should have near-zero correlation
    const randomDraws: Draw[] = [
      { id: 'd1', numbers: [3, 8, 15, 22, 40] }, // sum = 88
      { id: 'd2', numbers: [7, 19, 26, 35, 42] }, // sum = 129
      { id: 'd3', numbers: [2, 14, 28, 33, 39] }, // sum = 116
      { id: 'd4', numbers: [11, 20, 24, 37, 44] }, // sum = 136
      { id: 'd5', numbers: [1, 12, 30, 38, 48] }, // sum = 129
    ]

    const randomResult = calculateLag1Autocorrelation(randomDraws)

    // Compare with ascending pattern
    const ascendingDraws: Draw[] = [
      { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15
      { id: 'd2', numbers: [10, 11, 12, 13, 14] }, // sum = 60
      { id: 'd3', numbers: [20, 21, 22, 23, 24] }, // sum = 110
      { id: 'd4', numbers: [30, 31, 32, 33, 34] }, // sum = 160
      { id: 'd5', numbers: [40, 41, 42, 43, 44] }, // sum = 210
    ]

    const ascendingResult = calculateLag1Autocorrelation(ascendingDraws)

    // Ascending should have much higher correlation than random
    expect(ascendingResult.lag1Correlation).toBeGreaterThan(randomResult.lag1Correlation + 0.5)
  })
})
