"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const RandomPickingStrategy_1 = require("../../src/infrastructure/RandomPickingStrategy");
const PCG32RandomProvider_1 = require("../../src/infrastructure/PCG32RandomProvider");
(0, vitest_1.describe)('RandomPickingStrategy - Pure Random Selection', () => {
    let rng;
    let strategy;
    (0, vitest_1.beforeEach)(() => {
        rng = new PCG32RandomProvider_1.PCG32RandomProvider();
        rng.seed('random-seed');
        strategy = new RandomPickingStrategy_1.RandomPickingStrategy(rng);
    });
    (0, vitest_1.describe)('Main Pool Pick Generation', () => {
        (0, vitest_1.it)('generates valid main pool picks', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
            };
            const pick = await strategy.generateMainPoolPick(config);
            (0, vitest_1.expect)(pick).toHaveLength(5);
            (0, vitest_1.expect)(pick.every((n) => n >= 1 && n <= 50)).toBe(true);
            (0, vitest_1.expect)(new Set(pick).size).toBe(5); // All distinct
        });
        (0, vitest_1.it)('generates different picks across multiple calls', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
            };
            const pick1 = await strategy.generateMainPoolPick(config);
            const pick2 = await strategy.generateMainPoolPick(config);
            const pick3 = await strategy.generateMainPoolPick(config);
            // At least one should be different (very high probability)
            const allSame = JSON.stringify(pick1) === JSON.stringify(pick2) &&
                JSON.stringify(pick2) === JSON.stringify(pick3);
            (0, vitest_1.expect)(allSame).toBe(false);
        });
        (0, vitest_1.it)('works with different pool sizes', async () => {
            const configs = [
                { mainPool: { minNumber: 1, maxNumber: 10, count: 3 } },
                { mainPool: { minNumber: 1, maxNumber: 100, count: 10 } },
                { mainPool: { minNumber: 5, maxNumber: 25, count: 5 } },
            ];
            for (const config of configs) {
                const pick = await strategy.generateMainPoolPick(config);
                (0, vitest_1.expect)(pick).toHaveLength(config.mainPool.count);
                (0, vitest_1.expect)(pick.every((n) => n >= config.mainPool.minNumber && n <= config.mainPool.maxNumber)).toBe(true);
                (0, vitest_1.expect)(new Set(pick).size).toBe(pick.length);
            }
        });
    });
    (0, vitest_1.describe)('Bonus Pool Pick Generation', () => {
        (0, vitest_1.it)('returns empty array when no bonus pool configured', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
            };
            const bonusPick = await strategy.generateBonusPoolPick(config);
            (0, vitest_1.expect)(bonusPick).toEqual([]);
        });
        (0, vitest_1.it)('generates valid bonus pool picks when configured', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
                bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
            };
            const bonusPick = await strategy.generateBonusPoolPick(config);
            (0, vitest_1.expect)(bonusPick).toHaveLength(1);
            (0, vitest_1.expect)(bonusPick[0]).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(bonusPick[0]).toBeLessThanOrEqual(20);
        });
        (0, vitest_1.it)('handles multi-count bonus pools', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
                bonusPool: { minNumber: 1, maxNumber: 50, count: 3 },
            };
            const bonusPick = await strategy.generateBonusPoolPick(config);
            (0, vitest_1.expect)(bonusPick).toHaveLength(3);
            (0, vitest_1.expect)(bonusPick.every((n) => n >= 1 && n <= 50)).toBe(true);
            (0, vitest_1.expect)(new Set(bonusPick).size).toBe(3); // All distinct
        });
    });
    (0, vitest_1.describe)('Randomness Properties', () => {
        (0, vitest_1.it)('produces uniform distribution across pool', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 10, count: 1 },
            };
            const iterations = 1000;
            const frequency = {};
            for (let i = 0; i < iterations; i++) {
                const pick = await strategy.generateMainPoolPick(config);
                const num = pick[0];
                frequency[num] = (frequency[num] || 0) + 1;
            }
            // Each number should appear roughly equally (1000 / 10 = 100 times ±variance)
            const counts = Object.values(frequency);
            const mean = counts.reduce((a, b) => a + b) / counts.length;
            const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2)) / counts.length;
            const stdDev = Math.sqrt(variance);
            // Standard deviation should be reasonable for uniform distribution
            (0, vitest_1.expect)(stdDev).toBeLessThan(50); // Allow some variance
            (0, vitest_1.expect)(counts.length).toBe(10); // All 10 numbers should appear
        });
        (0, vitest_1.it)('never generates duplicates within a pick', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 10 },
            };
            for (let i = 0; i < 20; i++) {
                const pick = await strategy.generateMainPoolPick(config);
                (0, vitest_1.expect)(new Set(pick).size).toBe(pick.length);
            }
        });
    });
    (0, vitest_1.describe)('Reproducibility with Same Seed', () => {
        (0, vitest_1.it)('generates same sequence when seeded identically', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
            };
            // First sequence
            rng.seed('reproducible');
            const picks1 = [];
            for (let i = 0; i < 5; i++) {
                picks1.push(Array.from(await strategy.generateMainPoolPick(config)));
            }
            // Second sequence with same seed
            rng.seed('reproducible');
            const picks2 = [];
            for (let i = 0; i < 5; i++) {
                picks2.push(Array.from(await strategy.generateMainPoolPick(config)));
            }
            (0, vitest_1.expect)(JSON.stringify(picks1)).toBe(JSON.stringify(picks2));
        });
        (0, vitest_1.it)('generates different sequence with different seed', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
            };
            // First sequence
            rng.seed('seed-a');
            const pick1 = await strategy.generateMainPoolPick(config);
            // Second sequence with different seed
            rng.seed('seed-b');
            const pick2 = await strategy.generateMainPoolPick(config);
            (0, vitest_1.expect)(JSON.stringify(pick1)).not.toBe(JSON.stringify(pick2));
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('handles minimum pool size (1 number)', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 1 },
            };
            const pick = await strategy.generateMainPoolPick(config);
            (0, vitest_1.expect)(pick).toHaveLength(1);
            (0, vitest_1.expect)(pick[0]).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(pick[0]).toBeLessThanOrEqual(50);
        });
        (0, vitest_1.it)('handles full pool selection (count = pool size)', async () => {
            const config = {
                mainPool: { minNumber: 1, maxNumber: 10, count: 10 },
            };
            const pick = await strategy.generateMainPoolPick(config);
            (0, vitest_1.expect)(pick).toHaveLength(10);
            (0, vitest_1.expect)(new Set(pick).size).toBe(10);
            (0, vitest_1.expect)(pick.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });
    });
});
//# sourceMappingURL=randomPickingStrategy.spec.js.map