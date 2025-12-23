"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomPickingStrategy = void 0;
/**
 * RandomPickingStrategy generates lottery picks using pure random selection.
 * No constraints or balancing applied - just uniform random selection from the pool.
 * Used as the baseline comparison for strategy simulations.
 */
class RandomPickingStrategy {
    rng;
    constructor(rng) {
        this.rng = rng;
    }
    async generateMainPoolPick(config) {
        return this.selectRandomNumbers(config.mainPool);
    }
    async generateBonusPoolPick(config) {
        if (!config.bonusPool) {
            return [];
        }
        return this.selectRandomNumbers(config.bonusPool);
    }
    /**
     * Select k distinct numbers without replacement from [min, max].
     * Uses Fisher-Yates shuffle for uniform distribution.
     */
    selectRandomNumbers(pool) {
        const { minNumber, maxNumber, count } = pool;
        const available = Array.from({ length: maxNumber - minNumber + 1 }, (_, i) => minNumber + i);
        // Fisher-Yates shuffle to select first `count` elements
        for (let i = 0; i < count; i++) {
            const j = i + this.rng.nextInt(available.length - i);
            const temp = available[i];
            available[i] = available[j];
            available[j] = temp;
        }
        return available.slice(0, count);
    }
}
exports.RandomPickingStrategy = RandomPickingStrategy;
//# sourceMappingURL=RandomPickingStrategy.js.map