import type { GameConfig } from './GameConfig'

/**
 * Strategy interface for generating lottery picks.
 * Implementations determine how to select numbers and validate
 * the resulting pick according to domain rules.
 */
export interface IPickingStrategy {
  /**
   * Generate a lottery pick (array of numbers) for the main pool.
   * The pick should be validated against domain constraints (if any).
   * @param config - Game configuration defining pool ranges and sizes
   * @returns Promise resolving to an array of selected numbers
   */
  generateMainPoolPick(config: GameConfig): Promise<readonly number[]>

  /**
   * Generate a lottery pick for the bonus pool (if configured).
   * @param config - Game configuration defining pool ranges and sizes
   * @returns Promise resolving to an array of bonus numbers, or empty array if no bonus pool
   */
  generateBonusPoolPick(config: GameConfig): Promise<readonly number[]>
}
