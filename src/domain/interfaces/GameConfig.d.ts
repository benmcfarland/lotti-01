export interface PoolConfig {
    readonly minNumber: number;
    readonly maxNumber: number;
    readonly count: number;
}
/**
 * GameConfig defines the number pools for a lottery game.
 * - `mainPool` is required
 * - `bonusPool` is optional
 *
 * This is pure domain code with no external dependencies.
 */
export interface GameConfig {
    readonly mainPool: PoolConfig;
    readonly bonusPool?: PoolConfig;
}
//# sourceMappingURL=GameConfig.d.ts.map