import type { IPickingStrategy } from '../domain/interfaces/IPickingStrategy'
import type { GameConfig, PoolConfig } from '../domain/interfaces/GameConfig'
import type { IRandomProvider } from '../domain/IRandomProvider'

/**
 * RandomPickingStrategy generates lottery picks using pure random selection.
 * No constraints or balancing applied - just uniform random selection from the pool.
 * Used as the baseline comparison for strategy simulations.
 */
export class RandomPickingStrategy implements IPickingStrategy {
  constructor(private readonly rng: IRandomProvider) {}

  async generateMainPoolPick(config: GameConfig): Promise<readonly number[]> {
    return this.selectRandomNumbers(config.mainPool)
  }

  async generateBonusPoolPick(config: GameConfig): Promise<readonly number[]> {
    if (!config.bonusPool) {
      return []
    }
    return this.selectRandomNumbers(config.bonusPool)
  }

  /**
   * Select k distinct numbers without replacement from [min, max].
   * Uses Fisher-Yates shuffle for uniform distribution.
   */
  private selectRandomNumbers(pool: PoolConfig): number[] {
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
}
