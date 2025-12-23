import type { IPickingStrategy } from '../domain/interfaces/IPickingStrategy';
import type { GameConfig } from '../domain/interfaces/GameConfig';
import type { IRandomProvider } from '../domain/IRandomProvider';
/**
 * Simulation result for a single strategy/random track
 */
export interface SimulationTrackResult {
    readonly strategyName: string;
    readonly totalIterations: number;
    readonly matchesCount: number;
    readonly matchRate: number;
    readonly expectedMatches: number;
    readonly roi: number;
}
/**
 * Complete simulation report comparing strategy vs random picking
 */
export interface SimulationReport {
    readonly gameId: string;
    readonly gameConfig: GameConfig;
    readonly iterations: number;
    readonly targetNumbers: number[];
    readonly targetBonus: number | undefined;
    readonly strategyTrack: SimulationTrackResult;
    readonly randomTrack: SimulationTrackResult;
    readonly divergence: number;
    readonly conclusion: string;
    readonly timestamp: string;
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
export declare class SimulateStrategy {
    private readonly strategy;
    private readonly rng;
    private readonly gameConfig;
    constructor(strategy: IPickingStrategy, rng: IRandomProvider, gameConfig: GameConfig);
    /**
     * Execute the dual-track simulation.
     * @param gameId Identifier for this simulation
     * @param targetNumbers The winning main pool numbers (what we're trying to match)
     * @param targetBonus Optional winning bonus number
     * @param iterations Number of iterations per track (default: 10000)
     * @returns SimulationReport with detailed results
     */
    execute(gameId: string, targetNumbers: readonly number[], targetBonus?: number, iterations?: number): Promise<SimulationReport>;
    /**
     * Run strategy track: execute strategy N times and count matches
     */
    private runStrategyTrack;
    /**
     * Run random track: use pure random picking N times and count matches
     */
    private runRandomTrack;
    /**
     * Check if a pick matches the target numbers
     */
    private isMatch;
    /**
     * Calculate expected number of matches by random chance.
     * Based on combinatorial probability.
     */
    private calculateExpectedMatches;
    /**
     * Validate target numbers are within pool ranges
     */
    private validateTargetNumbers;
    /**
     * Generate human-readable conclusion about the simulation
     */
    private generateConclusion;
}
//# sourceMappingURL=SimulateStrategy.d.ts.map