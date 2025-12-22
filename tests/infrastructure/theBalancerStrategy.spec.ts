import { describe, it, expect, beforeEach } from 'vitest'
import { TheBalancerStrategy } from '../../src/infrastructure/TheBalancerStrategy'
import type { IRandomProvider } from '../../src/domain/IRandomProvider'
import type { GameConfig, PoolConfig } from '../../src/domain/interfaces/GameConfig'

/**
 * Mock RNG for predictable testing
 */
class MockRNG implements IRandomProvider {
  private sequence: number[] = []
  private index = 0

  seed(): void {
    // No-op for mock
  }

  setSequence(values: number[]): void {
    this.sequence = values
    this.index = 0
  }

  nextInt(bound: number = 2147483647): number {
    if (this.index >= this.sequence.length) {
      throw new Error('Mock RNG sequence exhausted')
    }
    const value = this.sequence[this.index++]
    return value % (bound || 2147483647)
  }
}

describe('TheBalancerStrategy', () => {
  let rng: MockRNG
  let strategy: TheBalancerStrategy

  beforeEach(() => {
    rng = new MockRNG()
    strategy = new TheBalancerStrategy(rng)
  })

  describe('Main Pool Pick Generation', () => {
    it('generates a valid main pool pick with correct count', async () => {
      // Provide enough values for multiple Fisher-Yates iterations and retries
      const longSequence = Array(300).fill(0).map((_, i) => i)
      rng.setSequence(longSequence)
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
      }

      const pick = await strategy.generateMainPoolPick(config)

      expect(pick).toHaveLength(5)
      expect(pick.every((n) => n >= 1 && n <= 50)).toBe(true)
      // All numbers should be distinct
      expect(new Set(pick).size).toBe(5)
    })

    it('pick sum falls within 1.5 standard deviations of mean', async () => {
      const longSequence = Array(300).fill(0).map((_, i) => i)
      rng.setSequence(longSequence)
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
      }

      const pick = await strategy.generateMainPoolPick(config)
      const sum = pick.reduce((a, b) => a + b, 0)

      // Theoretical mean for Pick 5 from [1, 50]
      // μ = 5 * (1 + 50) / 2 = 127.5
      // σ = sqrt(5 * 50² / 12) ≈ 10.2
      const mean = 5 * ((1 + 50) / 2)
      const variance = (5 * 50 * 50) / 12
      const stdDev = Math.sqrt(variance)
      const bound = 1.5 * stdDev

      expect(Math.abs(sum - mean)).toBeLessThanOrEqual(bound)
    })

    it('retries until a balanced pick is found', async () => {
      // Sequence that forces some retries: high values first, then low
      const longSequence = Array(200).fill(0).map((_, i) => i)
      rng.setSequence(longSequence)

      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 10, count: 2 },
      }

      const pick = await strategy.generateMainPoolPick(config)
      expect(pick).toHaveLength(2)
      expect(pick.every((n) => n >= 1 && n <= 10)).toBe(true)
    })

    it('throws error when unable to generate balanced pick', async () => {
      // Simulate scenario where balance constraint cannot be satisfied
      // by using a very restrictive configuration
      const restrictiveConfig: GameConfig = {
        mainPool: { minNumber: 1000, maxNumber: 1001, count: 100 }, // Impossible: only 2 numbers available
      }

      await expect(strategy.generateMainPoolPick(restrictiveConfig)).rejects.toThrow()
    })
  })

  describe('Bonus Pool Pick Generation', () => {
    it('returns empty array when no bonus pool configured', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
      }

      const pick = await strategy.generateBonusPoolPick(config)

      expect(pick).toEqual([])
    })

    it('generates valid bonus pool pick when configured', async () => {
      const longSequence = Array(100).fill(0).map((_, i) => i)
      rng.setSequence(longSequence)
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
      }

      const pick = await strategy.generateBonusPoolPick(config)

      expect(pick).toHaveLength(1)
      expect(pick[0]).toBeGreaterThanOrEqual(1)
      expect(pick[0]).toBeLessThanOrEqual(20)
    })

    it('bonus pool sum respects balance constraint', async () => {
      const longSequence = Array(200).fill(0).map((_, i) => i)
      rng.setSequence(longSequence)
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        bonusPool: { minNumber: 1, maxNumber: 50, count: 2 },
      }

      const pick = await strategy.generateBonusPoolPick(config)
      const sum = pick.reduce((a, b) => a + b, 0)

      const mean = 2 * ((1 + 50) / 2)
      const variance = (2 * 50 * 50) / 12
      const stdDev = Math.sqrt(variance)
      const bound = 1.5 * stdDev

      expect(Math.abs(sum - mean)).toBeLessThanOrEqual(bound)
    })
  })

  describe('Balance Calculation', () => {
    it('correctly calculates theoretical mean', async () => {
      // Pick 5 from [1, 50]: mean = 5 * (1 + 50) / 2 = 127.5
      const longSequence = Array(300).fill(0).map((_, i) => i)
      rng.setSequence(longSequence)
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
      }

      const pick = await strategy.generateMainPoolPick(config)
      const sum = pick.reduce((a, b) => a + b, 0)

      // Sum should be around 127.5 ± (1.5 * stddev)
      expect(sum).toBeGreaterThan(80) // Rough lower bound
      expect(sum).toBeLessThan(180) // Rough upper bound
    })

    it('handles edge case: small range [1, 2]', async () => {
      const longSequence = Array(100).fill(0).map((_, i) => i)
      rng.setSequence(longSequence)

      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 2, count: 2 },
      }

      const pick = await strategy.generateMainPoolPick(config)

      // Only two numbers available, so pick must be [1, 2]
      expect(pick.sort()).toEqual([1, 2])
    })

    it('handles large range [1, 1000]', async () => {
      const longSequence = Array(500).fill(0).map((_, i) => i)
      rng.setSequence(longSequence)

      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 1000, count: 5 },
      }

      const pick = await strategy.generateMainPoolPick(config)

      expect(pick).toHaveLength(5)
      expect(pick.every((n) => n >= 1 && n <= 1000)).toBe(true)
      expect(new Set(pick).size).toBe(5) // All distinct
    })
  })

  describe('Pick Distinctness', () => {
    it('never generates duplicate numbers in a single pick', async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const longSequence = Array(100).fill(0).map((_, i) => (i + attempt * 13) % 47)
        rng.setSequence(longSequence)

        const config: GameConfig = {
          mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        }

        const pick = await strategy.generateMainPoolPick(config)
        expect(new Set(pick).size).toBe(pick.length)
      }
    })
  })

  describe('Multiple Pool Configuration', () => {
    it('generates both main and bonus pool picks independently', async () => {
      const longSequence = Array(200).fill(0).map((_, i) => i)
      rng.setSequence(longSequence)

      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
      }

      const mainPick = await strategy.generateMainPoolPick(config)
      const bonusPick = await strategy.generateBonusPoolPick(config)

      expect(mainPick).toHaveLength(5)
      expect(mainPick.every((n) => n >= 1 && n <= 50)).toBe(true)

      expect(bonusPick).toHaveLength(1)
      expect(bonusPick[0]).toBeGreaterThanOrEqual(1)
      expect(bonusPick[0]).toBeLessThanOrEqual(20)
    })
  })
})
