import type { IPickingStrategy } from '../domain/interfaces/IPickingStrategy'
import type { GameConfig, PoolConfig } from '../domain/interfaces/GameConfig'
import type { IRandomProvider } from '../domain/IRandomProvider'

/**
 * TheBalancerStrategy generates lottery picks where the sum falls within
 * 1.5 standard deviations of the theoretical mean for the pool.
 *
 * This validates that picks are statistically "balanced" - not extreme
 * in either direction (too high or too low sums).
 *
 * Mathematical basis:
 * - For a uniform distribution on [min, max], the mean of k selections is:
 *   μ = k * (min + max) / 2
 * - The variance is:
 *   σ² = k * (max - min + 1)² / 12  [for discrete uniform]
 * - We accept picks where sum ∈ [μ - 1.5σ, μ + 1.5σ] (~93% of normal distribution)
 */
export class TheBalancerStrategy implements IPickingStrategy {
  constructor(private readonly rng: IRandomProvider) {}

  async generateMainPoolPick(config: GameConfig): Promise<readonly number[]> {
    return this.generatePoolPick(config.mainPool)
  }

  async generateBonusPoolPick(config: GameConfig): Promise<readonly number[]> {
    if (!config.bonusPool) {
      return []
    }
    return this.generatePoolPick(config.bonusPool)
  }

  /**
   * Generate a balanced pick from the given pool.
   * Retries until sum falls within 1.5 standard deviations of theoretical mean.
   * @param pool - Pool configuration (min, max, count)
   * @returns Array of selected numbers
   * @throws Error if unable to generate valid pick after max retries
   */
  private async generatePoolPick(pool: PoolConfig): Promise<readonly number[]> {
    const maxRetries = 100
    let attempts = 0

    while (attempts < maxRetries) {
      attempts++
      try {
        const pick = this.selectNumbers(pool)
        const sum = pick.reduce((a, b) => a + b, 0)

        if (this.isBalanced(sum, pool)) {
          return pick
        }
      } catch (error) {
        // If RNG exhausted, break immediately
        if (error instanceof Error && error.message.includes('exhausted')) {
          break
        }
        throw error
      }
    }

    throw new Error(
      `Failed to generate balanced pick for pool [${pool.minNumber}, ${pool.maxNumber}] after ${maxRetries} attempts`
    )
  }

  /**
   * Select k distinct numbers without replacement from [min, max].
   * Uses Fisher-Yates shuffle for uniform distribution.
   */
  private selectNumbers(pool: PoolConfig): number[] {
    const { minNumber, maxNumber, count } = pool
    const available = Array.from({ length: maxNumber - minNumber + 1 }, (_, i) => minNumber + i)

    // Fisher-Yates shuffle to select first `count` elements
    for (let i = 0; i < count; i++) {
      const j = i + this.rng.nextInt(available.length - i)
      const temp = available[i] as number
      available[i] = available[j] as number
      available[j] = temp
    }

    return available.slice(0, count)
  }

  /**
   * Determine if a sum is within 1.5 standard deviations of the theoretical mean.
   * @param sum - Sum of the selected numbers
   * @param pool - Pool configuration
   * @returns true if sum is balanced (within bounds), false otherwise
   */
  private isBalanced(sum: number, pool: PoolConfig): boolean {
    const mean = this.calculateMean(pool)
    const stdDev = this.calculateStdDev(pool)
    const bound = 1.5 * stdDev

    return Math.abs(sum - mean) <= bound
  }

  /**
   * Calculate theoretical mean for k selections from [min, max].
   * μ = k * (min + max) / 2
   */
  private calculateMean(pool: PoolConfig): number {
    const { minNumber, maxNumber, count } = pool
    return count * ((minNumber + maxNumber) / 2)
  }

  /**
   * Calculate theoretical standard deviation for k selections from discrete uniform [min, max].
   * For discrete uniform: σ = sqrt(k * (max - min + 1)² / 12)
   */
  private calculateStdDev(pool: PoolConfig): number {
    const { minNumber, maxNumber, count } = pool
    const range = maxNumber - minNumber + 1
    const variance = (count * range * range) / 12
    return Math.sqrt(variance)
  }
}
