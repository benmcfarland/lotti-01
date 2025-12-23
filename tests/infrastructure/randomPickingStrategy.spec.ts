import { describe, it, expect, beforeEach } from 'vitest'
import { RandomPickingStrategy } from '../../src/infrastructure/RandomPickingStrategy'
import { PCG32RandomProvider } from '../../src/infrastructure/PCG32RandomProvider'
import type { GameConfig } from '../../src/domain/interfaces/GameConfig'

describe('RandomPickingStrategy - Pure Random Selection', () => {
  let rng: PCG32RandomProvider
  let strategy: RandomPickingStrategy

  beforeEach(() => {
    rng = new PCG32RandomProvider()
    rng.seed('random-seed')
    strategy = new RandomPickingStrategy(rng)
  })

  describe('Main Pool Pick Generation', () => {
    it('generates valid main pool picks', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
      }

      const pick = await strategy.generateMainPoolPick(config)

      expect(pick).toHaveLength(5)
      expect(pick.every((n) => n >= 1 && n <= 50)).toBe(true)
      expect(new Set(pick).size).toBe(5) // All distinct
    })

    it('generates different picks across multiple calls', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
      }

      const pick1 = await strategy.generateMainPoolPick(config)
      const pick2 = await strategy.generateMainPoolPick(config)
      const pick3 = await strategy.generateMainPoolPick(config)

      // At least one should be different (very high probability)
      const allSame = JSON.stringify(pick1) === JSON.stringify(pick2) &&
        JSON.stringify(pick2) === JSON.stringify(pick3)

      expect(allSame).toBe(false)
    })

    it('works with different pool sizes', async () => {
      const configs = [
        { mainPool: { minNumber: 1, maxNumber: 10, count: 3 } },
        { mainPool: { minNumber: 1, maxNumber: 100, count: 10 } },
        { mainPool: { minNumber: 5, maxNumber: 25, count: 5 } },
      ]

      for (const config of configs) {
        const pick = await strategy.generateMainPoolPick(config as GameConfig)

        expect(pick).toHaveLength(config.mainPool.count)
        expect(pick.every((n) => n >= config.mainPool.minNumber && n <= config.mainPool.maxNumber)).toBe(true)
        expect(new Set(pick).size).toBe(pick.length)
      }
    })
  })

  describe('Bonus Pool Pick Generation', () => {
    it('returns empty array when no bonus pool configured', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
      }

      const bonusPick = await strategy.generateBonusPoolPick(config)

      expect(bonusPick).toEqual([])
    })

    it('generates valid bonus pool picks when configured', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
      }

      const bonusPick = await strategy.generateBonusPoolPick(config)

      expect(bonusPick).toHaveLength(1)
      expect(bonusPick[0]).toBeGreaterThanOrEqual(1)
      expect(bonusPick[0]).toBeLessThanOrEqual(20)
    })

    it('handles multi-count bonus pools', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        bonusPool: { minNumber: 1, maxNumber: 50, count: 3 },
      }

      const bonusPick = await strategy.generateBonusPoolPick(config)

      expect(bonusPick).toHaveLength(3)
      expect(bonusPick.every((n) => n >= 1 && n <= 50)).toBe(true)
      expect(new Set(bonusPick).size).toBe(3) // All distinct
    })
  })

  describe('Randomness Properties', () => {
    it('produces uniform distribution across pool', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 10, count: 1 },
      }

      const iterations = 1000
      const frequency: { [key: number]: number } = {}

      for (let i = 0; i < iterations; i++) {
        const pick = await strategy.generateMainPoolPick(config)
        const num = pick[0]
        frequency[num] = (frequency[num] || 0) + 1
      }

      // Each number should appear roughly equally (1000 / 10 = 100 times ±variance)
      const counts = Object.values(frequency)
      const mean = counts.reduce((a, b) => a + b) / counts.length
      const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2)) / counts.length
      const stdDev = Math.sqrt(variance)

      // Standard deviation should be reasonable for uniform distribution
      expect(stdDev).toBeLessThan(50) // Allow some variance
      expect(counts.length).toBe(10) // All 10 numbers should appear
    })

    it('never generates duplicates within a pick', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 10 },
      }

      for (let i = 0; i < 20; i++) {
        const pick = await strategy.generateMainPoolPick(config)
        expect(new Set(pick).size).toBe(pick.length)
      }
    })
  })

  describe('Reproducibility with Same Seed', () => {
    it('generates same sequence when seeded identically', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
      }

      // First sequence
      rng.seed('reproducible')
      const picks1: number[][] = []
      for (let i = 0; i < 5; i++) {
        picks1.push(Array.from(await strategy.generateMainPoolPick(config)))
      }

      // Second sequence with same seed
      rng.seed('reproducible')
      const picks2: number[][] = []
      for (let i = 0; i < 5; i++) {
        picks2.push(Array.from(await strategy.generateMainPoolPick(config)))
      }

      expect(JSON.stringify(picks1)).toBe(JSON.stringify(picks2))
    })

    it('generates different sequence with different seed', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
      }

      // First sequence
      rng.seed('seed-a')
      const pick1 = await strategy.generateMainPoolPick(config)

      // Second sequence with different seed
      rng.seed('seed-b')
      const pick2 = await strategy.generateMainPoolPick(config)

      expect(JSON.stringify(pick1)).not.toBe(JSON.stringify(pick2))
    })
  })

  describe('Edge Cases', () => {
    it('handles minimum pool size (1 number)', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 1 },
      }

      const pick = await strategy.generateMainPoolPick(config)

      expect(pick).toHaveLength(1)
      expect(pick[0]).toBeGreaterThanOrEqual(1)
      expect(pick[0]).toBeLessThanOrEqual(50)
    })

    it('handles full pool selection (count = pool size)', async () => {
      const config: GameConfig = {
        mainPool: { minNumber: 1, maxNumber: 10, count: 10 },
      }

      const pick = await strategy.generateMainPoolPick(config)

      expect(pick).toHaveLength(10)
      expect(new Set(pick).size).toBe(10)
      expect(pick.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })
  })
})
