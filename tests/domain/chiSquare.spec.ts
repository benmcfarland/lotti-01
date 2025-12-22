import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { calculateChiSquare } from '../../src/domain/math/ChiSquare'
import type { GameConfig } from '../../src/domain/interfaces/GameConfig'
import type { Draw } from '../../src/domain/Draw'

describe('Chi-Square Test with Decile Binning', () => {
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

  it('calculates Chi-Square for uniform distribution (synthetic fixture)', () => {
    const result = calculateChiSquare(syntheticDraws, gameConfig)

    // For perfectly uniform distribution, Chi-Square should be near zero
    expect(result.chiSquareStatistic).toBeLessThan(1)
    expect(result.degreesOfFreedom).toBe(9)
    // p-value should be very high (close to 1) for perfectly uniform distribution
    expect(result.pValue).toBeGreaterThan(0.99)
  })

  it('returns correct bin structure', () => {
    const result = calculateChiSquare(syntheticDraws, gameConfig)

    expect(result.binObserved.length).toBe(10)
    expect(result.binExpected.length).toBe(10)
    expect(result.binObserved.every((v) => typeof v === 'number')).toBe(true)
  })

  it('total observed frequencies match total numbers drawn', () => {
    const result = calculateChiSquare(syntheticDraws, gameConfig)

    const totalObserved = result.binObserved.reduce((sum, v) => sum + v, 0)
    const expectedTotal = syntheticDraws.length * 5 // 50 draws × 5 numbers

    expect(totalObserved).toBe(expectedTotal)
  })

  it('throws on empty draws array', () => {
    expect(() => calculateChiSquare([], gameConfig)).toThrow()
  })

  it('throws on out-of-range numbers', () => {
    const badDraws: Draw[] = [{ id: 'bad', numbers: [1, 99, 3, 4, 5] }]
    expect(() => calculateChiSquare(badDraws, gameConfig)).toThrow()
  })

  it('detects non-uniform distribution (skewed example)', () => {
    // Create draws heavily skewed toward low numbers
    const skewedDraws: Draw[] = []
    for (let i = 0; i < 50; i++) {
      skewedDraws.push({
        id: `skew-${i}`,
        numbers: [
          Math.floor(Math.random() * 10) + 1, // Biased to 1-10
          Math.floor(Math.random() * 10) + 1,
          Math.floor(Math.random() * 50) + 1, // Uniform for fill
          Math.floor(Math.random() * 50) + 1,
          Math.floor(Math.random() * 50) + 1,
        ].sort((a, b) => a - b),
      })
    }

    const result = calculateChiSquare(skewedDraws, gameConfig)

    // Skewed distribution should have higher Chi-Square
    expect(result.chiSquareStatistic).toBeGreaterThan(1)
    // p-value should be lower for non-uniform (less than 0.99)
    expect(result.pValue).toBeLessThan(0.99)
  })

  it('verifies expected frequency calculation', () => {
    const result = calculateChiSquare(syntheticDraws, gameConfig)

    const totalObserved = result.binObserved.reduce((sum, v) => sum + v, 0)
    const expectedPerBin = totalObserved / 10

    // All bins should have nearly the same expected frequency
    result.binExpected.forEach((exp) => {
      expect(exp).toBe(expectedPerBin)
    })
  })

  it('p-value is in valid range [0, 1]', () => {
    const result = calculateChiSquare(syntheticDraws, gameConfig)

    expect(result.pValue).toBeGreaterThanOrEqual(0)
    expect(result.pValue).toBeLessThanOrEqual(1)
  })

  it('handles small sample sizes via binning', () => {
    const smallDraws: Draw[] = [
      { id: 'small-1', numbers: [1, 11, 21, 31, 41] },
      { id: 'small-2', numbers: [2, 12, 22, 32, 42] },
    ]

    // Should not throw even with small sample
    const result = calculateChiSquare(smallDraws, gameConfig)

    expect(result.chiSquareStatistic).toBeGreaterThanOrEqual(0)
    expect(result.degreesOfFreedom).toBe(9)
  })
})
