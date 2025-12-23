import type { IPickingStrategy } from '../domain/interfaces/IPickingStrategy';
import type { GameConfig } from '../domain/interfaces/GameConfig';
import type { IRandomProvider } from '../domain/IRandomProvider';
/**
 * RandomPickingStrategy generates lottery picks using pure random selection.
 * No constraints or balancing applied - just uniform random selection from the pool.
 * Used as the baseline comparison for strategy simulations.
 */
export declare class RandomPickingStrategy implements IPickingStrategy {
    private readonly rng;
    constructor(rng: IRandomProvider);
    generateMainPoolPick(config: GameConfig): Promise<readonly number[]>;
    generateBonusPoolPick(config: GameConfig): Promise<readonly number[]>;
    /**
     * Select k distinct numbers without replacement from [min, max].
     * Uses Fisher-Yates shuffle for uniform distribution.
     */
    private selectRandomNumbers;
}
//# sourceMappingURL=RandomPickingStrategy.d.ts.map