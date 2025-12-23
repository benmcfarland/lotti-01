import type { IPickingStrategy } from '../domain/interfaces/IPickingStrategy'
import type { GameConfig } from '../domain/interfaces/GameConfig'
import type { IRandomProvider } from '../domain/IRandomProvider'
import { RandomPickingStrategy } from '../infrastructure/RandomPickingStrategy'

/**
 * Simulation result for a single strategy/random track
 */
export interface SimulationTrackResult {
  readonly strategyName: string
  readonly totalIterations: number
  readonly matchesCount: number
  readonly matchRate: number
  readonly expectedMatches: number
  readonly roi: number
}

/**
 * Complete simulation report comparing strategy vs random picking
 */
export interface SimulationReport {
  readonly gameId: string
  readonly gameConfig: GameConfig
  readonly iterations: number
  readonly targetNumbers: number[]
  readonly targetBonus: number | undefined
  readonly strategyTrack: SimulationTrackResult
  readonly randomTrack: SimulationTrackResult
  readonly divergence: number
  readonly conclusion: string
  readonly timestamp: string
}

/**
 * SimulateStrategy application service.
 *
 * Runs a dual-track simulation:
 * 1. 10,000 iterations of a chosen picking strategy
 * 2. 10,000 iterations of pure random picking
 *
 * Both tracks target the same winning numbers and compare:
 * - Match rates (how many iterations hit all numbers)
 * - ROI (matches vs expected by chance)
 * - Divergence (strategy performance - random performance)
 *
 * Expected outcome: divergence ≈ 0, demonstrating the strategy
 * performs identically to random picking over large samples.
 */
export class SimulateStrategy {
  constructor(
    private readonly strategy: IPickingStrategy,
    private readonly rng: IRandomProvider,
    private readonly gameConfig: GameConfig,
  ) {}

  /**
   * Execute the dual-track simulation.
   * @param gameId Identifier for this simulation
   * @param targetNumbers The winning main pool numbers (what we're trying to match)
   * @param targetBonus Optional winning bonus number
   * @param iterations Number of iterations per track (default: 10000)
   * @returns SimulationReport with detailed results
   */
  async execute(
    gameId: string,
    targetNumbers: readonly number[],
    targetBonus?: number,
    iterations: number = 10000,
  ): Promise<SimulationReport> {
    // Validate target numbers
    this.validateTargetNumbers(targetNumbers, targetBonus)

    // Run strategy track
    const strategyTrack = await this.runStrategyTrack(iterations, targetNumbers, targetBonus)

    // Run random track
    const randomTrack = await this.runRandomTrack(iterations, targetNumbers, targetBonus)

    // Calculate divergence
    const divergence = strategyTrack.roi - randomTrack.roi

    // Generate conclusion
    const conclusion = this.generateConclusion(divergence, strategyTrack, randomTrack)

    const timestamp = new Date().toISOString()

    return {
      gameId,
      gameConfig: this.gameConfig,
      iterations,
      targetNumbers: Array.from(targetNumbers),
      targetBonus,
      strategyTrack,
      randomTrack,
      divergence,
      conclusion,
      timestamp,
    }
  }

  /**
   * Run strategy track: execute strategy N times and count matches
   */
  private async runStrategyTrack(
    iterations: number,
    targetNumbers: readonly number[],
    targetBonus: number | undefined,
  ): Promise<SimulationTrackResult> {
    let matchesCount = 0

    for (let i = 0; i < iterations; i++) {
      const mainPick = await this.strategy.generateMainPoolPick(this.gameConfig)
      const bonusPick = await this.strategy.generateBonusPoolPick(this.gameConfig)

      if (this.isMatch(mainPick, bonusPick, targetNumbers, targetBonus)) {
        matchesCount++
      }
    }

    const expectedMatches = this.calculateExpectedMatches(iterations, targetNumbers, targetBonus)
    const matchRate = matchesCount / iterations
    const roi = matchesCount > 0 ? (matchesCount / expectedMatches - 1) * 100 : 0

    return {
      strategyName: 'Strategy Track',
      totalIterations: iterations,
      matchesCount,
      matchRate,
      expectedMatches,
      roi,
    }
  }

  /**
   * Run random track: use pure random picking N times and count matches
   */
  private async runRandomTrack(
    iterations: number,
    targetNumbers: readonly number[],
    targetBonus: number | undefined,
  ): Promise<SimulationTrackResult> {
    const randomStrategy = new RandomPickingStrategy(this.rng)
    let matchesCount = 0

    for (let i = 0; i < iterations; i++) {
      const mainPick = await randomStrategy.generateMainPoolPick(this.gameConfig)
      const bonusPick = await randomStrategy.generateBonusPoolPick(this.gameConfig)

      if (this.isMatch(mainPick, bonusPick, targetNumbers, targetBonus)) {
        matchesCount++
      }
    }

    const expectedMatches = this.calculateExpectedMatches(iterations, targetNumbers, targetBonus)
    const matchRate = matchesCount / iterations
    const roi = matchesCount > 0 ? (matchesCount / expectedMatches - 1) * 100 : 0

    return {
      strategyName: 'Random Track',
      totalIterations: iterations,
      matchesCount,
      matchRate,
      expectedMatches,
      roi,
    }
  }

  /**
   * Check if a pick matches the target numbers
   */
  private isMatch(
    mainPick: readonly number[],
    bonusPick: readonly number[],
    targetNumbers: readonly number[],
    targetBonus: number | undefined,
  ): boolean {
    // Check if all target numbers are in the pick
    const mainMatch = targetNumbers.every((n) => mainPick.includes(n))

    // If bonus expected, check it matches
    if (targetBonus !== undefined) {
      return mainMatch && bonusPick.length > 0 && bonusPick[0] === targetBonus
    }

    return mainMatch
  }

  /**
   * Calculate expected number of matches by random chance.
   * Based on combinatorial probability.
   */
  private calculateExpectedMatches(
    iterations: number,
    targetNumbers: readonly number[],
    targetBonus: number | undefined,
  ): number {
    const mainPool = this.gameConfig.mainPool
    const bonusPool = this.gameConfig.bonusPool

    // Probability of selecting all target numbers in main pool
    // P(main match) = C(k, k) * C(n-k, k-k) / C(n, k)
    // where n = pool size, k = numbers to select
    const nCr = (n: number, r: number): number => {
      if (r > n) return 0
      if (r === 0 || r === n) return 1
      let result = 1
      for (let i = 0; i < r; i++) {
        result = (result * (n - i)) / (i + 1)
      }
      return result
    }

    const poolSize = mainPool.maxNumber - mainPool.minNumber + 1
    const mainProb = 1 / nCr(poolSize, mainPool.count)

    // If bonus pool exists, include its probability
    let totalProb = mainProb
    if (targetBonus !== undefined && bonusPool) {
      const bonusPoolSize = bonusPool.maxNumber - bonusPool.minNumber + 1
      const bonusProb = 1 / bonusPoolSize
      totalProb = mainProb * bonusProb
    }

    return Math.max(1, Math.round(iterations * totalProb))
  }

  /**
   * Validate target numbers are within pool ranges
   */
  private validateTargetNumbers(targetNumbers: readonly number[], targetBonus?: number): void {
    const mainPool = this.gameConfig.mainPool

    for (const num of targetNumbers) {
      if (num < mainPool.minNumber || num > mainPool.maxNumber) {
        throw new Error(
          `Target number ${num} outside main pool range [${mainPool.minNumber}, ${mainPool.maxNumber}]`,
        )
      }
    }

    if (targetNumbers.length !== mainPool.count) {
      throw new Error(
        `Expected ${mainPool.count} target numbers, got ${targetNumbers.length}`,
      )
    }

    if (targetBonus !== undefined && this.gameConfig.bonusPool) {
      const bonusPool = this.gameConfig.bonusPool
      if (targetBonus < bonusPool.minNumber || targetBonus > bonusPool.maxNumber) {
        throw new Error(
          `Bonus number ${targetBonus} outside bonus pool range [${bonusPool.minNumber}, ${bonusPool.maxNumber}]`,
        )
      }
    }
  }

  /**
   * Generate human-readable conclusion about the simulation
   */
  private generateConclusion(
    divergence: number,
    strategyTrack: SimulationTrackResult,
    randomTrack: SimulationTrackResult,
  ): string {
    const absDivergence = Math.abs(divergence)
    const threshold = 5 // Allow ±5% divergence due to random variation

    if (absDivergence < threshold) {
      return `Strategy performs identically to random selection (divergence: ${divergence.toFixed(2)}%). ` +
        `Both tracks achieved similar ROI, confirming the strategy provides no statistical advantage.`
    } else if (divergence > threshold) {
      return `Strategy outperforms random selection by ${divergence.toFixed(2)}% ROI. ` +
        `However, verify this exceeds normal statistical variation (${threshold}% threshold).`
    } else {
      return `Random selection outperforms strategy by ${Math.abs(divergence).toFixed(2)}% ROI. ` +
        `Strategy underperformed the baseline, indicating ineffectiveness.`
    }
  }
}
