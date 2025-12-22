import type { IPickingStrategy } from '../domain/interfaces/IPickingStrategy';
import type { GameConfig } from '../domain/interfaces/GameConfig';
import type { IRandomProvider } from '../domain/IRandomProvider';
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
export declare class TheBalancerStrategy implements IPickingStrategy {
    private readonly rng;
    constructor(rng: IRandomProvider);
    generateMainPoolPick(config: GameConfig): Promise<readonly number[]>;
    generateBonusPoolPick(config: GameConfig): Promise<readonly number[]>;
    /**
     * Generate a balanced pick from the given pool.
     * Retries until sum falls within 1.5 standard deviations of theoretical mean.
     * @param pool - Pool configuration (min, max, count)
     * @returns Array of selected numbers
     * @throws Error if unable to generate valid pick after max retries
     */
    private generatePoolPick;
    /**
     * Select k distinct numbers without replacement from [min, max].
     * Uses Fisher-Yates shuffle for uniform distribution.
     */
    private selectNumbers;
    /**
     * Determine if a sum is within 1.5 standard deviations of the theoretical mean.
     * @param sum - Sum of the selected numbers
     * @param pool - Pool configuration
     * @returns true if sum is balanced (within bounds), false otherwise
     */
    private isBalanced;
    /**
     * Calculate theoretical mean for k selections from [min, max].
     * μ = k * (min + max) / 2
     */
    private calculateMean;
    /**
     * Calculate theoretical standard deviation for k selections from discrete uniform [min, max].
     * For discrete uniform: σ = sqrt(k * (max - min + 1)² / 12)
     */
    private calculateStdDev;
}
//# sourceMappingURL=TheBalancerStrategy.d.ts.map