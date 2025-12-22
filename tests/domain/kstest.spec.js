"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const KSTest_1 = require("../../src/domain/math/KSTest");
(0, vitest_1.describe)('Kolmogorov-Smirnov Test for Draw Sums', () => {
    let syntheticDraws;
    let gameConfig;
    (0, vitest_1.beforeAll)(() => {
        const fixture = JSON.parse((0, fs_1.readFileSync)('tests/fixtures/synthetic_data.json', 'utf-8'));
        syntheticDraws = fixture.data.map((d) => ({
            id: `draw-${d.drawId}`,
            numbers: d.numbers,
        }));
        gameConfig = {
            mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        };
    });
    (0, vitest_1.it)('calculates KS test on synthetic uniform draws', () => {
        const result = (0, KSTest_1.calculateKSTest)(syntheticDraws, gameConfig);
        (0, vitest_1.expect)(result.dStatistic).toBeDefined();
        (0, vitest_1.expect)(result.dStatistic).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(result.dStatistic).toBeLessThanOrEqual(1);
    });
    (0, vitest_1.it)('returns sums array matching number of draws', () => {
        const result = (0, KSTest_1.calculateKSTest)(syntheticDraws, gameConfig);
        (0, vitest_1.expect)(result.sums.length).toBe(syntheticDraws.length);
        (0, vitest_1.expect)(result.sums.every((s) => typeof s === 'number')).toBe(true);
    });
    (0, vitest_1.it)('calculates empirical mean close to theoretical mean for uniform distribution', () => {
        const result = (0, KSTest_1.calculateKSTest)(syntheticDraws, gameConfig);
        // Theoretical mean for uniform [1,50] with 5 draws:
        // Mean of single draw: (1 + 50) / 2 = 25.5
        // Mean of sum: 25.5 * 5 = 127.5
        (0, vitest_1.expect)(result.theoreticalMean).toBe(127.5);
        // Empirical should be close (within 10%)
        (0, vitest_1.expect)(Math.abs(result.empiricalMean - result.theoreticalMean)).toBeLessThan(10);
    });
    (0, vitest_1.it)('calculates empirical stddev close to theoretical stddev', () => {
        const result = (0, KSTest_1.calculateKSTest)(syntheticDraws, gameConfig);
        // Theoretical stddev for uniform [1,50]:
        // Single variance: ((50 - 1 + 1)² - 1) / 12 = (2500 - 1) / 12 ≈ 208.25
        // Sum variance: 208.25 * 5 ≈ 1041.25
        // StdDev: √1041.25 ≈ 32.27
        const expected = 32.27;
        (0, vitest_1.expect)(Math.abs(result.theoreticalStdDev - expected)).toBeLessThan(1);
        // Empirical should be reasonably close
        (0, vitest_1.expect)(Math.abs(result.empiricalStdDev - expected)).toBeLessThan(5);
    });
    (0, vitest_1.it)('classifies uniform distribution as Random', () => {
        const result = (0, KSTest_1.calculateKSTest)(syntheticDraws, gameConfig);
        (0, vitest_1.expect)(result.classification).toBe('Random');
    });
    (0, vitest_1.it)('D-statistic is in valid range [0, 1]', () => {
        const result = (0, KSTest_1.calculateKSTest)(syntheticDraws, gameConfig);
        (0, vitest_1.expect)(result.dStatistic).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(result.dStatistic).toBeLessThanOrEqual(1);
    });
    (0, vitest_1.it)('detects patterned distribution (all same sum)', () => {
        // Create draws with fixed sum (all numbers sum to same value)
        const patternedDraws = [
            { id: 'd1', numbers: [10, 11, 12, 13, 14] }, // sum = 60
            { id: 'd2', numbers: [10, 11, 12, 13, 14] }, // sum = 60
            { id: 'd3', numbers: [10, 11, 12, 13, 14] }, // sum = 60
            { id: 'd4', numbers: [10, 11, 12, 13, 14] }, // sum = 60
            { id: 'd5', numbers: [10, 11, 12, 13, 14] }, // sum = 60
        ];
        const result = (0, KSTest_1.calculateKSTest)(patternedDraws, gameConfig);
        // D-statistic should be very high (all sums identical)
        (0, vitest_1.expect)(result.dStatistic).toBeGreaterThan(0.5);
    });
    (0, vitest_1.it)('handles draws with varying sums correctly', () => {
        const varyingDraws = [
            { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15
            { id: 'd2', numbers: [10, 15, 20, 25, 30] }, // sum = 100
            { id: 'd3', numbers: [45, 46, 47, 48, 49] }, // sum = 235
            { id: 'd4', numbers: [5, 10, 15, 20, 25] }, // sum = 75
            { id: 'd5', numbers: [25, 26, 27, 28, 29] }, // sum = 135
        ];
        const result = (0, KSTest_1.calculateKSTest)(varyingDraws, gameConfig);
        // Should have reasonable D-statistic
        (0, vitest_1.expect)(result.dStatistic).toBeLessThanOrEqual(1);
        (0, vitest_1.expect)(result.sums).toEqual([15, 100, 235, 75, 135]);
    });
    (0, vitest_1.it)('throws on empty draws array', () => {
        (0, vitest_1.expect)(() => (0, KSTest_1.calculateKSTest)([], gameConfig)).toThrow();
    });
    (0, vitest_1.it)('theoretical values match manual calculation', () => {
        const result = (0, KSTest_1.calculateKSTest)(syntheticDraws, gameConfig);
        // For Pick 5 on [1, 50]:
        // Single draw mean: (1 + 50) / 2 = 25.5
        // Sum of 5: 25.5 * 5 = 127.5
        (0, vitest_1.expect)(result.theoreticalMean).toBe(127.5);
        // Variance of single draw from discrete uniform [1, 50]:
        // n = 50, variance = ((50+1)(50-1)) / 12 = (51 * 49) / 12 = 2499 / 12 ≈ 208.25
        // Variance of sum of 5: 208.25 * 5 ≈ 1041.25
        // StdDev: √1041.25 ≈ 32.27
        const expectedVariance = (51 * 49) / 12 * 5;
        (0, vitest_1.expect)(Math.abs(result.theoreticalStdDev ** 2 - expectedVariance)).toBeLessThan(1);
    });
    (0, vitest_1.it)('classification flag is one of the expected values', () => {
        const result = (0, KSTest_1.calculateKSTest)(syntheticDraws, gameConfig);
        (0, vitest_1.expect)(['Random', 'Patterned']).toContain(result.classification);
    });
});
//# sourceMappingURL=kstest.spec.js.map