import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { calculateKSTest } from '../../src/domain/math/KSTest'
import type { GameConfig } from '../../src/domain/interfaces/GameConfig'
import type { Draw } from '../../src/domain/Draw'

describe('Kolmogorov-Smirnov Test for Draw Sums', () => {
  let syntheticDraws: Draw[]
  let gameConfig: GameConfig

  beforeAll(() => {
    const fixture = JSON.parse(readFileSync('tests/fixtures/synthetic_data.json', 'utf-8'))
    syntheticDraws = fixture.data.map(
      (d: { drawId: number; numbers: number[] }) => ({
        id: `draw-${d.drawId}`,
        numbers: d.numbers,
      })
    )
    gameConfig = {
      mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
    }
  })

  it('calculates KS test on synthetic uniform draws', () => {
    const result = calculateKSTest(syntheticDraws, gameConfig)

    expect(result.dStatistic).toBeDefined()
    expect(result.dStatistic).toBeGreaterThanOrEqual(0)
    expect(result.dStatistic).toBeLessThanOrEqual(1)
  })

  it('returns sums array matching number of draws', () => {
    const result = calculateKSTest(syntheticDraws, gameConfig)

    expect(result.sums.length).toBe(syntheticDraws.length)
    expect(result.sums.every((s) => typeof s === 'number')).toBe(true)
  })

  it('calculates empirical mean close to theoretical mean for uniform distribution', () => {
    const result = calculateKSTest(syntheticDraws, gameConfig)

    // Theoretical mean for uniform [1,50] with 5 draws:
    // Mean of single draw: (1 + 50) / 2 = 25.5
    // Mean of sum: 25.5 * 5 = 127.5
    expect(result.theoreticalMean).toBe(127.5)

    // Empirical should be close (within 10%)
    expect(Math.abs(result.empiricalMean - result.theoreticalMean)).toBeLessThan(10)
  })

  it('calculates empirical stddev close to theoretical stddev', () => {
    const result = calculateKSTest(syntheticDraws, gameConfig)

    // Theoretical stddev for uniform [1,50]:
    // Single variance: ((50 - 1 + 1)² - 1) / 12 = (2500 - 1) / 12 ≈ 208.25
    // Sum variance: 208.25 * 5 ≈ 1041.25
    // StdDev: √1041.25 ≈ 32.27
    const expected = 32.27
    expect(Math.abs(result.theoreticalStdDev - expected)).toBeLessThan(1)

    // Empirical should be reasonably close
    expect(Math.abs(result.empiricalStdDev - expected)).toBeLessThan(5)
  })

  it('classifies uniform distribution as Random', () => {
    const result = calculateKSTest(syntheticDraws, gameConfig)

    expect(result.classification).toBe('Random')
  })

  it('D-statistic is in valid range [0, 1]', () => {
    const result = calculateKSTest(syntheticDraws, gameConfig)

    expect(result.dStatistic).toBeGreaterThanOrEqual(0)
    expect(result.dStatistic).toBeLessThanOrEqual(1)
  })

  it('detects patterned distribution (all same sum)', () => {
    // Create draws with fixed sum (all numbers sum to same value)
    const patternedDraws: Draw[] = [
      { id: 'd1', numbers: [10, 11, 12, 13, 14] }, // sum = 60
      { id: 'd2', numbers: [10, 11, 12, 13, 14] }, // sum = 60
      { id: 'd3', numbers: [10, 11, 12, 13, 14] }, // sum = 60
      { id: 'd4', numbers: [10, 11, 12, 13, 14] }, // sum = 60
      { id: 'd5', numbers: [10, 11, 12, 13, 14] }, // sum = 60
    ]

    const result = calculateKSTest(patternedDraws, gameConfig)

    // D-statistic should be very high (all sums identical)
    expect(result.dStatistic).toBeGreaterThan(0.5)
  })

  it('handles draws with varying sums correctly', () => {
    const varyingDraws: Draw[] = [
      { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15
      { id: 'd2', numbers: [10, 15, 20, 25, 30] }, // sum = 100
      { id: 'd3', numbers: [45, 46, 47, 48, 49] }, // sum = 235
      { id: 'd4', numbers: [5, 10, 15, 20, 25] }, // sum = 75
      { id: 'd5', numbers: [25, 26, 27, 28, 29] }, // sum = 135
    ]

    const result = calculateKSTest(varyingDraws, gameConfig)

    // Should have reasonable D-statistic
    expect(result.dStatistic).toBeLessThanOrEqual(1)
    expect(result.sums).toEqual([15, 100, 235, 75, 135])
  })

  it('throws on empty draws array', () => {
    expect(() => calculateKSTest([], gameConfig)).toThrow()
  })

  it('theoretical values match manual calculation', () => {
    const result = calculateKSTest(syntheticDraws, gameConfig)

    // For Pick 5 on [1, 50]:
    // Single draw mean: (1 + 50) / 2 = 25.5
    // Sum of 5: 25.5 * 5 = 127.5
    expect(result.theoreticalMean).toBe(127.5)

    // Variance of single draw from discrete uniform [1, 50]:
    // n = 50, variance = ((50+1)(50-1)) / 12 = (51 * 49) / 12 = 2499 / 12 ≈ 208.25
    // Variance of sum of 5: 208.25 * 5 ≈ 1041.25
    // StdDev: √1041.25 ≈ 32.27
    const expectedVariance = (51 * 49) / 12 * 5
    expect(Math.abs(result.theoreticalStdDev ** 2 - expectedVariance)).toBeLessThan(1)
  })

  it('classification flag is one of the expected values', () => {
    const result = calculateKSTest(syntheticDraws, gameConfig)

    expect(['Random', 'Patterned']).toContain(result.classification)
  })
})
