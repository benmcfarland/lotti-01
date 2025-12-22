import type { GameConfig } from '../interfaces/GameConfig';
/**
 * Immutable value object representing an unordered set of ball numbers for a pool.
 * Validates count and range according to a provided `GameConfig` and pool type.
 */
export declare class BallSet {
    private readonly numbers;
    private readonly poolKey;
    constructor(numbers: readonly number[], config: GameConfig, pool?: 'main' | 'bonus');
    toArray(): number[];
    contains(n: number): boolean;
    equals(other: BallSet): boolean;
}
//# sourceMappingURL=BallSet.d.ts.map