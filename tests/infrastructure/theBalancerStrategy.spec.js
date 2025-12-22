"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TheBalancerStrategy_1 = require("../../src/infrastructure/TheBalancerStrategy");
/**
 * Mock RNG for predictable testing
 */
class MockRNG {
    sequence = [];
    index = 0;
    seed() {
        // No-op for mock
    }
    setSequence(values) {
        this.sequence = values;
        this.index = 0;
    }
    nextInt(bound = 2147483647) {
        if (this.index >= this.sequence.length) {
            throw new Error('Mock RNG sequence exhausted');
        }
        const value = this.sequence[this.index++];
        return value % (bound || 2147483647);
    }
}
(0, vitest_1.describe)('TheBalancerStrategy', () => {
    let rng;
    let strategy;
    (0, vitest_1.beforeEach)(() => {
        rng = new MockRNG();
        strategy = new TheBalancerStrategy_1.TheBalancerStrategy(rng);
    });
    (0, vitest_1.describe)('Main Pool Pick Generation', () => {
        (0, vitest_1.it)('generates a valid main pool pick with correct count', async () => {
            // Provide enough values for multiple Fisher-Yates iterations and retries
            const longSequence = Array(300).fill(0).map((_, i) => i);
            rng.setSequence(longSequence);
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
            };
            const pick = await strategy.generateMainPoolPick(config);
            (0, vitest_1.expect)(pick).toHaveLength(5);
            (0, vitest_1.expect)(pick.every((n) => n >= 1 && n <= 50)).toBe(true);
            // All numbers should be distinct
            (0, vitest_1.expect)(new Set(pick).size).toBe(5);
        });
        (0, vitest_1.it)('pick sum falls within 1.5 standard deviations of mean', async () => {
            const longSequence = Array(300).fill(0).map((_, i) => i);
            rng.setSequence(longSequence);
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
            };
            const pick = await strategy.generateMainPoolPick(config);
            const sum = pick.reduce((a, b) => a + b, 0);
            // Theoretical mean for Pick 5 from [1, 50]
            // μ = 5 * (1 + 50) / 2 = 127.5
            // σ = sqrt(5 * 50² / 12) ≈ 10.2
            const mean = 5 * ((1 + 50) / 2);
            const variance = (5 * 50 * 50) / 12;
            const stdDev = Math.sqrt(variance);
            const bound = 1.5 * stdDev;
            (0, vitest_1.expect)(Math.abs(sum - mean)).toBeLessThanOrEqual(bound);
        });
        (0, vitest_1.it)('retries until a balanced pick is found', async () => {
            // Sequence that forces some retries: high values first, then low
            const longSequence = Array(200).fill(0).map((_, i) => i);
            rng.setSequence(longSequence);
            const config = {
                mainPool: { minNumber: 1, maxNumber: 10, count: 2 },
            };
            const pick = await strategy.generateMainPoolPick(config);
            (0, vitest_1.expect)(pick).toHaveLength(2);
            (0, vitest_1.expect)(pick.every((n) => n >= 1 && n <= 10)).toBe(true);
        });
        (0, vitest_1.it)('throws error when unable to generate balanced pick', async () => {
            // Simulate scenario where balance constraint cannot be satisfied
            // by using a very restrictive configuration
            const restrictiveConfig = {
                mainPool: { minNumber: 1000, maxNumber: 1001, count: 100 }, // Impossible: only 2 numbers available
            };
            await (0, vitest_1.expect)(strategy.generateMainPoolPick(restrictiveConfig)).rejects.toThrow();
        });
    });
    (0, vitest_1.describe)('Bonus Pool Pick Generation', () => {
        (0, vitest_1.it)('returns empty array when no bonus pool configured', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
            };
            const pick = await strategy.generateBonusPoolPick(config);
            (0, vitest_1.expect)(pick).toEqual([]);
        });
        (0, vitest_1.it)('generates valid bonus pool pick when configured', async () => {
            const longSequence = Array(100).fill(0).map((_, i) => i);
            rng.setSequence(longSequence);
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
                bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
            };
            const pick = await strategy.generateBonusPoolPick(config);
            (0, vitest_1.expect)(pick).toHaveLength(1);
            (0, vitest_1.expect)(pick[0]).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(pick[0]).toBeLessThanOrEqual(20);
        });
        (0, vitest_1.it)('bonus pool sum respects balance constraint', async () => {
            const longSequence = Array(200).fill(0).map((_, i) => i);
            rng.setSequence(longSequence);
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
                bonusPool: { minNumber: 1, maxNumber: 50, count: 2 },
            };
            const pick = await strategy.generateBonusPoolPick(config);
            const sum = pick.reduce((a, b) => a + b, 0);
            const mean = 2 * ((1 + 50) / 2);
            const variance = (2 * 50 * 50) / 12;
            const stdDev = Math.sqrt(variance);
            const bound = 1.5 * stdDev;
            (0, vitest_1.expect)(Math.abs(sum - mean)).toBeLessThanOrEqual(bound);
        });
    });
    (0, vitest_1.describe)('Balance Calculation', () => {
        (0, vitest_1.it)('correctly calculates theoretical mean', async () => {
            // Pick 5 from [1, 50]: mean = 5 * (1 + 50) / 2 = 127.5
            const longSequence = Array(300).fill(0).map((_, i) => i);
            rng.setSequence(longSequence);
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
            };
            const pick = await strategy.generateMainPoolPick(config);
            const sum = pick.reduce((a, b) => a + b, 0);
            // Sum should be around 127.5 ± (1.5 * stddev)
            (0, vitest_1.expect)(sum).toBeGreaterThan(80); // Rough lower bound
            (0, vitest_1.expect)(sum).toBeLessThan(180); // Rough upper bound
        });
        (0, vitest_1.it)('handles edge case: small range [1, 2]', async () => {
            const longSequence = Array(100).fill(0).map((_, i) => i);
            rng.setSequence(longSequence);
            const config = {
                mainPool: { minNumber: 1, maxNumber: 2, count: 2 },
            };
            const pick = await strategy.generateMainPoolPick(config);
            // Only two numbers available, so pick must be [1, 2]
            (0, vitest_1.expect)(pick.sort()).toEqual([1, 2]);
        });
        (0, vitest_1.it)('handles large range [1, 1000]', async () => {
            const longSequence = Array(500).fill(0).map((_, i) => i);
            rng.setSequence(longSequence);
            const config = {
                mainPool: { minNumber: 1, maxNumber: 1000, count: 5 },
            };
            const pick = await strategy.generateMainPoolPick(config);
            (0, vitest_1.expect)(pick).toHaveLength(5);
            (0, vitest_1.expect)(pick.every((n) => n >= 1 && n <= 1000)).toBe(true);
            (0, vitest_1.expect)(new Set(pick).size).toBe(5); // All distinct
        });
    });
    (0, vitest_1.describe)('Pick Distinctness', () => {
        (0, vitest_1.it)('never generates duplicate numbers in a single pick', async () => {
            for (let attempt = 0; attempt < 5; attempt++) {
                const longSequence = Array(100).fill(0).map((_, i) => (i + attempt * 13) % 47);
                rng.setSequence(longSequence);
                const config = {
                    mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
                };
                const pick = await strategy.generateMainPoolPick(config);
                (0, vitest_1.expect)(new Set(pick).size).toBe(pick.length);
            }
        });
    });
    (0, vitest_1.describe)('Multiple Pool Configuration', () => {
        (0, vitest_1.it)('generates both main and bonus pool picks independently', async () => {
            const longSequence = Array(200).fill(0).map((_, i) => i);
            rng.setSequence(longSequence);
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
                bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
            };
            const mainPick = await strategy.generateMainPoolPick(config);
            const bonusPick = await strategy.generateBonusPoolPick(config);
            (0, vitest_1.expect)(mainPick).toHaveLength(5);
            (0, vitest_1.expect)(mainPick.every((n) => n >= 1 && n <= 50)).toBe(true);
            (0, vitest_1.expect)(bonusPick).toHaveLength(1);
            (0, vitest_1.expect)(bonusPick[0]).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(bonusPick[0]).toBeLessThanOrEqual(20);
        });
    });
});
//# sourceMappingURL=theBalancerStrategy.spec.js.map