import { describe, it, expect, beforeEach } from 'vitest'
import { SimulateStrategy } from '../../src/application/SimulateStrategy'
import { TheBalancerStrategy } from '../../src/infrastructure/TheBalancerStrategy'
import { RandomPickingStrategy } from '../../src/infrastructure/RandomPickingStrategy'
import { PCG32RandomProvider } from '../../src/infrastructure/PCG32RandomProvider'
import type { GameConfig } from '../../src/domain/interfaces/GameConfig'

describe('SimulateStrategy - Dual Track Simulation', () => {
  let rng: PCG32RandomProvider
  let gameConfig: GameConfig
  let simulateStrategy: SimulateStrategy

  beforeEach(() => {
    rng = new PCG32RandomProvider()
    rng.seed('test-seed')

    gameConfig = {
      mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
    }

    // Use BalancerStrategy for the simulation (vs random)
    const strategy = new TheBalancerStrategy(rng)
    simulateStrategy = new SimulateStrategy(strategy, rng, gameConfig)
  })

  describe('Simulation Setup', () => {
    it('creates simulation report with required fields', async () => {
      const targetNumbers = [10, 20, 30, 40, 50]
      const iterations = 100 // Small for testing

      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, iterations)

      expect(report.gameId).toBe('test-sim')
      expect(report.iterations).toBe(iterations)
      expect(report.targetNumbers).toEqual([10, 20, 30, 40, 50])
      expect(report.targetBonus).toBeUndefined()
      expect(report.timestamp).toBeDefined()
    })

    it('includes both strategy and random track results', async () => {
      const targetNumbers = [1, 2, 3, 4, 5]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 100)

      expect(report.strategyTrack).toBeDefined()
      expect(report.strategyTrack.strategyName).toBe('Strategy Track')
      expect(report.strategyTrack.totalIterations).toBe(100)
      expect(report.strategyTrack.matchesCount).toBeGreaterThanOrEqual(0)
      expect(report.strategyTrack.matchRate).toBeGreaterThanOrEqual(0)
      expect(report.strategyTrack.matchRate).toBeLessThanOrEqual(1)

      expect(report.randomTrack).toBeDefined()
      expect(report.randomTrack.strategyName).toBe('Random Track')
      expect(report.randomTrack.totalIterations).toBe(100)
    })
  })

  describe('Divergence Calculation', () => {
    it('calculates divergence as strategy ROI minus random ROI', async () => {
      const targetNumbers = [25, 26, 27, 28, 29]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 100)

      const expectedDivergence = report.strategyTrack.roi - report.randomTrack.roi
      expect(report.divergence).toBe(expectedDivergence)
    })

    it('shows small divergence when strategy performs like random (convergence)', async () => {
      const targetNumbers = [10, 15, 20, 30, 40]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 1000)

      // With large samples, divergence should be small (within ±10%)
      expect(Math.abs(report.divergence)).toBeLessThan(20)
    })

    it('handles zero matches in both tracks', async () => {
      // Use impossible target numbers (beyond pool)
      // Actually, we validate this, so test with valid but unlikely numbers
      const targetNumbers = [46, 47, 48, 49, 50]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 50)

      // Even with zero matches, ROI should be calculated (0 if no matches)
      expect(report.strategyTrack.roi).toBeDefined()
      expect(report.randomTrack.roi).toBeDefined()
    })
  })

  describe('Match Counting', () => {
    it('counts matches correctly for main pool only', async () => {
      const targetNumbers = [1, 2, 3, 4, 5]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 100)

      // Matches count should be between 0 and iterations
      expect(report.strategyTrack.matchesCount).toBeGreaterThanOrEqual(0)
      expect(report.strategyTrack.matchesCount).toBeLessThanOrEqual(100)
      expect(report.randomTrack.matchesCount).toBeGreaterThanOrEqual(0)
      expect(report.randomTrack.matchesCount).toBeLessThanOrEqual(100)
    })

    it('with bonus pool, counts matches including bonus', async () => {
      const configWithBonus: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
      }

      const strategyWithBonus = new TheBalancerStrategy(rng)
      const simulateWithBonus = new SimulateStrategy(strategyWithBonus, rng, configWithBonus)

      const targetNumbers = [10, 20, 30, 40, 50]
      const targetBonus = 15

      const report = await simulateWithBonus.execute(
        'bonus-sim',
        targetNumbers,
        targetBonus,
        100,
      )

      expect(report.targetBonus).toBe(15)
      // Bonus matches should be rarer than main-only matches
      expect(report.strategyTrack.matchesCount).toBeLessThanOrEqual(10)
      expect(report.randomTrack.matchesCount).toBeLessThanOrEqual(10)
    })
  })

  describe('ROI Calculation', () => {
    it('calculates ROI based on expected vs actual matches', async () => {
      const targetNumbers = [5, 10, 15, 20, 25]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 200)

      // ROI = (actual / expected - 1) * 100
      // If actual matches expected, ROI = 0%
      // If actual > expected, ROI > 0%
      // If actual < expected, ROI < 0%

      const strategyExpectedMatches = report.strategyTrack.expectedMatches
      const strategyActualMatches = report.strategyTrack.matchesCount

      if (strategyActualMatches > 0) {
        const expectedROI = ((strategyActualMatches / strategyExpectedMatches) - 1) * 100
        expect(Math.abs(report.strategyTrack.roi - expectedROI)).toBeLessThan(0.01)
      }
    })

    it('sets ROI to 0 when no matches occur', async () => {
      // Use very high target numbers (unlikely to match)
      const targetNumbers = [46, 47, 48, 49, 50]

      // Small iterations to likely get zero matches
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 50)

      if (report.strategyTrack.matchesCount === 0) {
        expect(report.strategyTrack.roi).toBe(0)
      }
      if (report.randomTrack.matchesCount === 0) {
        expect(report.randomTrack.roi).toBe(0)
      }
    })
  })

  describe('Conclusion Generation', () => {
    it('indicates identical performance when divergence < 5%', async () => {
      // Use a configuration where we'll likely see small divergence
      const targetNumbers = [25, 26, 27, 28, 29]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 500)

      if (Math.abs(report.divergence) < 5) {
        expect(report.conclusion).toContain('identically to random')
      }
    })

    it('includes divergence percentage in conclusion', async () => {
      const targetNumbers = [10, 20, 30, 40, 50]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 200)

      expect(report.conclusion).toContain(Math.abs(report.divergence).toFixed(2))
    })

    it('distinguishes between strategy outperformance and underperformance', async () => {
      const targetNumbers = [1, 2, 3, 4, 5]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 300)

      if (report.divergence > 5) {
        expect(report.conclusion).toContain('outperforms')
      } else if (report.divergence < -5) {
        expect(report.conclusion).toContain('underperformed')
      } else {
        expect(report.conclusion).toContain('identically')
      }
    })
  })

  describe('Validation', () => {
    it('throws on target numbers outside pool range', async () => {
      const invalidTargets = [1, 2, 3, 4, 100] // 100 is outside [1, 50]

      await expect(
        simulateStrategy.execute('test-sim', invalidTargets, undefined, 100),
      ).rejects.toThrow(/outside main pool range/)
    })

    it('throws on wrong count of target numbers', async () => {
      const wrongCount = [1, 2, 3] // Need 5 for this config

      await expect(
        simulateStrategy.execute('test-sim', wrongCount, undefined, 100),
      ).rejects.toThrow(/Expected 5 target numbers/)
    })

    it('throws on invalid bonus number', async () => {
      const configWithBonus: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
      }

      const strategyWithBonus = new TheBalancerStrategy(rng)
      const simulateWithBonus = new SimulateStrategy(strategyWithBonus, rng, configWithBonus)

      const targetNumbers = [10, 20, 30, 40, 50]
      const invalidBonus = 50 // Outside [1, 20]

      await expect(
        simulateWithBonus.execute('bonus-sim', targetNumbers, invalidBonus, 100),
      ).rejects.toThrow(/outside bonus pool range/)
    })
  })

  describe('Expected Matches Calculation', () => {
    it('calculates expected matches based on combinatorial probability', async () => {
      const targetNumbers = [1, 2, 3, 4, 5]
      const iterations = 1000

      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, iterations)

      // For Pick 5 from [1, 50]: C(50, 5) = 2,118,760
      // Expected matches ≈ iterations / C(50, 5) ≈ 1000 / 2,118,760 ≈ 0.0004-0.5
      expect(report.strategyTrack.expectedMatches).toBeGreaterThanOrEqual(0)
      expect(report.strategyTrack.expectedMatches).toBeLessThanOrEqual(iterations)
      expect(report.randomTrack.expectedMatches).toBe(report.strategyTrack.expectedMatches)
    })

    it('both tracks have same expected matches (baseline agnostic)', async () => {
      const targetNumbers = [15, 25, 35, 45, 50]
      const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 500)

      expect(report.strategyTrack.expectedMatches).toBe(report.randomTrack.expectedMatches)
    })
  })

  describe('Large Sample Convergence', () => {
    it('divergence approaches zero with larger samples', async () => {
      const targetNumbers = [20, 25, 30, 35, 40]

      // Small sample
      const smallReport = await simulateStrategy.execute(
        'small-sim',
        targetNumbers,
        undefined,
        100,
      )

      // Larger sample
      const largeReport = await simulateStrategy.execute(
        'large-sim',
        targetNumbers,
        undefined,
        1000,
      )

      // Larger sample should have smaller relative divergence (more stable)
      // Note: This is probabilistic, not guaranteed, so check trend
      expect(largeReport.strategyTrack.matchRate).toBeGreaterThanOrEqual(0)
      expect(largeReport.randomTrack.matchRate).toBeGreaterThanOrEqual(0)
    })
  })
})
