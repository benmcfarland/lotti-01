'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const vitest_1 = require('vitest')
const fs_1 = require('fs')
const ChiSquare_1 = require('../../src/domain/math/ChiSquare')
;(0, vitest_1.describe)('Chi-Square Test with Decile Binning', () => {
  let syntheticDraws
  let gameConfig
  ;(0, vitest_1.beforeAll)(() => {
    const fixture = JSON.parse(
      (0, fs_1.readFileSync)('tests/fixtures/synthetic_data.json', 'utf-8')
    )
    syntheticDraws = fixture.data.map(d => ({
      id: `draw-${d.drawId}`,
      numbers: d.numbers,
    }))
    gameConfig = {
      mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
    }
  })
  ;(0, vitest_1.it)('calculates Chi-Square for uniform distribution (synthetic fixture)', () => {
    const result = (0, ChiSquare_1.calculateChiSquare)(syntheticDraws, gameConfig)
    // For perfectly uniform distribution, Chi-Square should be near zero
    ;(0, vitest_1.expect)(result.chiSquareStatistic).toBeLessThan(1)
    ;(0, vitest_1.expect)(result.degreesOfFreedom).toBe(9)
    // p-value should be very high (close to 1) for perfectly uniform distribution
    ;(0, vitest_1.expect)(result.pValue).toBeGreaterThan(0.99)
  })
  ;(0, vitest_1.it)('returns correct bin structure', () => {
    const result = (0, ChiSquare_1.calculateChiSquare)(syntheticDraws, gameConfig)
    ;(0, vitest_1.expect)(result.binObserved.length).toBe(10)
    ;(0, vitest_1.expect)(result.binExpected.length).toBe(10)
    ;(0, vitest_1.expect)(result.binObserved.every(v => typeof v === 'number')).toBe(true)
  })
  ;(0, vitest_1.it)('total observed frequencies match total numbers drawn', () => {
    const result = (0, ChiSquare_1.calculateChiSquare)(syntheticDraws, gameConfig)
    const totalObserved = result.binObserved.reduce((sum, v) => sum + v, 0)
    const expectedTotal = syntheticDraws.length * 5 // 50 draws × 5 numbers
    ;(0, vitest_1.expect)(totalObserved).toBe(expectedTotal)
  })
  ;(0, vitest_1.it)('throws on empty draws array', () => {
    ;(0, vitest_1.expect)(() => (0, ChiSquare_1.calculateChiSquare)([], gameConfig)).toThrow()
  })
  ;(0, vitest_1.it)('throws on out-of-range numbers', () => {
    const badDraws = [{ id: 'bad', numbers: [1, 99, 3, 4, 5] }]
    ;(0, vitest_1.expect)(() => (0, ChiSquare_1.calculateChiSquare)(badDraws, gameConfig)).toThrow()
  })
  ;(0, vitest_1.it)('detects non-uniform distribution (skewed example)', () => {
    // Create draws heavily skewed toward low numbers
    const skewedDraws = []
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
    const result = (0, ChiSquare_1.calculateChiSquare)(skewedDraws, gameConfig)
    // Skewed distribution should have higher Chi-Square
    ;(0, vitest_1.expect)(result.chiSquareStatistic).toBeGreaterThan(1)
    // p-value should be lower for non-uniform (less than 0.99)
    ;(0, vitest_1.expect)(result.pValue).toBeLessThan(0.99)
  })
  ;(0, vitest_1.it)('verifies expected frequency calculation', () => {
    const result = (0, ChiSquare_1.calculateChiSquare)(syntheticDraws, gameConfig)
    const totalObserved = result.binObserved.reduce((sum, v) => sum + v, 0)
    const expectedPerBin = totalObserved / 10
    // All bins should have nearly the same expected frequency
    result.binExpected.forEach(exp => {
      ;(0, vitest_1.expect)(exp).toBe(expectedPerBin)
    })
  })
  ;(0, vitest_1.it)('p-value is in valid range [0, 1]', () => {
    const result = (0, ChiSquare_1.calculateChiSquare)(syntheticDraws, gameConfig)
    ;(0, vitest_1.expect)(result.pValue).toBeGreaterThanOrEqual(0)
    ;(0, vitest_1.expect)(result.pValue).toBeLessThanOrEqual(1)
  })
  ;(0, vitest_1.it)('handles small sample sizes via binning', () => {
    const smallDraws = [
      { id: 'small-1', numbers: [1, 11, 21, 31, 41] },
      { id: 'small-2', numbers: [2, 12, 22, 32, 42] },
    ]
    // Should not throw even with small sample
    const result = (0, ChiSquare_1.calculateChiSquare)(smallDraws, gameConfig)
    ;(0, vitest_1.expect)(result.chiSquareStatistic).toBeGreaterThanOrEqual(0)
    ;(0, vitest_1.expect)(result.degreesOfFreedom).toBe(9)
  })
})
//# sourceMappingURL=chiSquare.spec.js.map
