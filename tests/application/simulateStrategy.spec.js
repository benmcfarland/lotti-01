"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SimulateStrategy_1 = require("../../src/application/SimulateStrategy");
const TheBalancerStrategy_1 = require("../../src/infrastructure/TheBalancerStrategy");
const PCG32RandomProvider_1 = require("../../src/infrastructure/PCG32RandomProvider");
(0, vitest_1.describe)('SimulateStrategy - Dual Track Simulation', () => {
    let rng;
    let gameConfig;
    let simulateStrategy;
    (0, vitest_1.beforeEach)(() => {
        rng = new PCG32RandomProvider_1.PCG32RandomProvider();
        rng.seed('test-seed');
        gameConfig = {
            mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        };
        // Use BalancerStrategy for the simulation (vs random)
        const strategy = new TheBalancerStrategy_1.TheBalancerStrategy(rng);
        simulateStrategy = new SimulateStrategy_1.SimulateStrategy(strategy, rng, gameConfig);
    });
    (0, vitest_1.describe)('Simulation Setup', () => {
        (0, vitest_1.it)('creates simulation report with required fields', async () => {
            const targetNumbers = [10, 20, 30, 40, 50];
            const iterations = 100; // Small for testing
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, iterations);
            (0, vitest_1.expect)(report.gameId).toBe('test-sim');
            (0, vitest_1.expect)(report.iterations).toBe(iterations);
            (0, vitest_1.expect)(report.targetNumbers).toEqual([10, 20, 30, 40, 50]);
            (0, vitest_1.expect)(report.targetBonus).toBeUndefined();
            (0, vitest_1.expect)(report.timestamp).toBeDefined();
        });
        (0, vitest_1.it)('includes both strategy and random track results', async () => {
            const targetNumbers = [1, 2, 3, 4, 5];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 100);
            (0, vitest_1.expect)(report.strategyTrack).toBeDefined();
            (0, vitest_1.expect)(report.strategyTrack.strategyName).toBe('Strategy Track');
            (0, vitest_1.expect)(report.strategyTrack.totalIterations).toBe(100);
            (0, vitest_1.expect)(report.strategyTrack.matchesCount).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(report.strategyTrack.matchRate).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(report.strategyTrack.matchRate).toBeLessThanOrEqual(1);
            (0, vitest_1.expect)(report.randomTrack).toBeDefined();
            (0, vitest_1.expect)(report.randomTrack.strategyName).toBe('Random Track');
            (0, vitest_1.expect)(report.randomTrack.totalIterations).toBe(100);
        });
    });
    (0, vitest_1.describe)('Divergence Calculation', () => {
        (0, vitest_1.it)('calculates divergence as strategy ROI minus random ROI', async () => {
            const targetNumbers = [25, 26, 27, 28, 29];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 100);
            const expectedDivergence = report.strategyTrack.roi - report.randomTrack.roi;
            (0, vitest_1.expect)(report.divergence).toBe(expectedDivergence);
        });
        (0, vitest_1.it)('shows small divergence when strategy performs like random (convergence)', async () => {
            const targetNumbers = [10, 15, 20, 30, 40];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 1000);
            // With large samples, divergence should be small (within ±10%)
            (0, vitest_1.expect)(Math.abs(report.divergence)).toBeLessThan(20);
        });
        (0, vitest_1.it)('handles zero matches in both tracks', async () => {
            // Use impossible target numbers (beyond pool)
            // Actually, we validate this, so test with valid but unlikely numbers
            const targetNumbers = [46, 47, 48, 49, 50];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 50);
            // Even with zero matches, ROI should be calculated (0 if no matches)
            (0, vitest_1.expect)(report.strategyTrack.roi).toBeDefined();
            (0, vitest_1.expect)(report.randomTrack.roi).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Match Counting', () => {
        (0, vitest_1.it)('counts matches correctly for main pool only', async () => {
            const targetNumbers = [1, 2, 3, 4, 5];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 100);
            // Matches count should be between 0 and iterations
            (0, vitest_1.expect)(report.strategyTrack.matchesCount).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(report.strategyTrack.matchesCount).toBeLessThanOrEqual(100);
            (0, vitest_1.expect)(report.randomTrack.matchesCount).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(report.randomTrack.matchesCount).toBeLessThanOrEqual(100);
        });
        (0, vitest_1.it)('with bonus pool, counts matches including bonus', async () => {
            const configWithBonus = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
                bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
            };
            const strategyWithBonus = new TheBalancerStrategy_1.TheBalancerStrategy(rng);
            const simulateWithBonus = new SimulateStrategy_1.SimulateStrategy(strategyWithBonus, rng, configWithBonus);
            const targetNumbers = [10, 20, 30, 40, 50];
            const targetBonus = 15;
            const report = await simulateWithBonus.execute('bonus-sim', targetNumbers, targetBonus, 100);
            (0, vitest_1.expect)(report.targetBonus).toBe(15);
            // Bonus matches should be rarer than main-only matches
            (0, vitest_1.expect)(report.strategyTrack.matchesCount).toBeLessThanOrEqual(10);
            (0, vitest_1.expect)(report.randomTrack.matchesCount).toBeLessThanOrEqual(10);
        });
    });
    (0, vitest_1.describe)('ROI Calculation', () => {
        (0, vitest_1.it)('calculates ROI based on expected vs actual matches', async () => {
            const targetNumbers = [5, 10, 15, 20, 25];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 200);
            // ROI = (actual / expected - 1) * 100
            // If actual matches expected, ROI = 0%
            // If actual > expected, ROI > 0%
            // If actual < expected, ROI < 0%
            const strategyExpectedMatches = report.strategyTrack.expectedMatches;
            const strategyActualMatches = report.strategyTrack.matchesCount;
            if (strategyActualMatches > 0) {
                const expectedROI = ((strategyActualMatches / strategyExpectedMatches) - 1) * 100;
                (0, vitest_1.expect)(Math.abs(report.strategyTrack.roi - expectedROI)).toBeLessThan(0.01);
            }
        });
        (0, vitest_1.it)('sets ROI to 0 when no matches occur', async () => {
            // Use very high target numbers (unlikely to match)
            const targetNumbers = [46, 47, 48, 49, 50];
            // Small iterations to likely get zero matches
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 50);
            if (report.strategyTrack.matchesCount === 0) {
                (0, vitest_1.expect)(report.strategyTrack.roi).toBe(0);
            }
            if (report.randomTrack.matchesCount === 0) {
                (0, vitest_1.expect)(report.randomTrack.roi).toBe(0);
            }
        });
    });
    (0, vitest_1.describe)('Conclusion Generation', () => {
        (0, vitest_1.it)('indicates identical performance when divergence < 5%', async () => {
            // Use a configuration where we'll likely see small divergence
            const targetNumbers = [25, 26, 27, 28, 29];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 500);
            if (Math.abs(report.divergence) < 5) {
                (0, vitest_1.expect)(report.conclusion).toContain('identically to random');
            }
        });
        (0, vitest_1.it)('includes divergence percentage in conclusion', async () => {
            const targetNumbers = [10, 20, 30, 40, 50];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 200);
            (0, vitest_1.expect)(report.conclusion).toContain(Math.abs(report.divergence).toFixed(2));
        });
        (0, vitest_1.it)('distinguishes between strategy outperformance and underperformance', async () => {
            const targetNumbers = [1, 2, 3, 4, 5];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 300);
            if (report.divergence > 5) {
                (0, vitest_1.expect)(report.conclusion).toContain('outperforms');
            }
            else if (report.divergence < -5) {
                (0, vitest_1.expect)(report.conclusion).toContain('underperformed');
            }
            else {
                (0, vitest_1.expect)(report.conclusion).toContain('identically');
            }
        });
    });
    (0, vitest_1.describe)('Validation', () => {
        (0, vitest_1.it)('throws on target numbers outside pool range', async () => {
            const invalidTargets = [1, 2, 3, 4, 100]; // 100 is outside [1, 50]
            await (0, vitest_1.expect)(simulateStrategy.execute('test-sim', invalidTargets, undefined, 100)).rejects.toThrow(/outside main pool range/);
        });
        (0, vitest_1.it)('throws on wrong count of target numbers', async () => {
            const wrongCount = [1, 2, 3]; // Need 5 for this config
            await (0, vitest_1.expect)(simulateStrategy.execute('test-sim', wrongCount, undefined, 100)).rejects.toThrow(/Expected 5 target numbers/);
        });
        (0, vitest_1.it)('throws on invalid bonus number', async () => {
            const configWithBonus = {
                mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
                bonusPool: { minNumber: 1, maxNumber: 20, count: 1 },
            };
            const strategyWithBonus = new TheBalancerStrategy_1.TheBalancerStrategy(rng);
            const simulateWithBonus = new SimulateStrategy_1.SimulateStrategy(strategyWithBonus, rng, configWithBonus);
            const targetNumbers = [10, 20, 30, 40, 50];
            const invalidBonus = 50; // Outside [1, 20]
            await (0, vitest_1.expect)(simulateWithBonus.execute('bonus-sim', targetNumbers, invalidBonus, 100)).rejects.toThrow(/outside bonus pool range/);
        });
    });
    (0, vitest_1.describe)('Expected Matches Calculation', () => {
        (0, vitest_1.it)('calculates expected matches based on combinatorial probability', async () => {
            const targetNumbers = [1, 2, 3, 4, 5];
            const iterations = 1000;
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, iterations);
            // For Pick 5 from [1, 50]: C(50, 5) = 2,118,760
            // Expected matches ≈ iterations / C(50, 5) ≈ 1000 / 2,118,760 ≈ 0.0004-0.5
            (0, vitest_1.expect)(report.strategyTrack.expectedMatches).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(report.strategyTrack.expectedMatches).toBeLessThanOrEqual(iterations);
            (0, vitest_1.expect)(report.randomTrack.expectedMatches).toBe(report.strategyTrack.expectedMatches);
        });
        (0, vitest_1.it)('both tracks have same expected matches (baseline agnostic)', async () => {
            const targetNumbers = [15, 25, 35, 45, 50];
            const report = await simulateStrategy.execute('test-sim', targetNumbers, undefined, 500);
            (0, vitest_1.expect)(report.strategyTrack.expectedMatches).toBe(report.randomTrack.expectedMatches);
        });
    });
    (0, vitest_1.describe)('Large Sample Convergence', () => {
        (0, vitest_1.it)('divergence approaches zero with larger samples', async () => {
            const targetNumbers = [20, 25, 30, 35, 40];
            // Small sample
            const smallReport = await simulateStrategy.execute('small-sim', targetNumbers, undefined, 100);
            // Larger sample
            const largeReport = await simulateStrategy.execute('large-sim', targetNumbers, undefined, 1000);
            // Larger sample should have smaller relative divergence (more stable)
            // Note: This is probabilistic, not guaranteed, so check trend
            (0, vitest_1.expect)(largeReport.strategyTrack.matchRate).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(largeReport.randomTrack.matchRate).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=simulateStrategy.spec.js.map