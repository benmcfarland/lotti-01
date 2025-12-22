"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const Autocorrelation_1 = require("../../src/domain/math/Autocorrelation");
(0, vitest_1.describe)('Lag-1 Autocorrelation Test for Draw Independence', () => {
    let syntheticDraws;
    (0, vitest_1.beforeAll)(() => {
        const fixture = JSON.parse((0, fs_1.readFileSync)('tests/fixtures/synthetic_data.json', 'utf-8'));
        syntheticDraws = fixture.data.map((d) => ({
            id: `draw-${d.drawId}`,
            numbers: d.numbers,
        }));
    });
    (0, vitest_1.it)('calculates Lag-1 autocorrelation on synthetic uniform draws', () => {
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(syntheticDraws);
        (0, vitest_1.expect)(result.lag1Correlation).toBeDefined();
        (0, vitest_1.expect)(result.lag1Correlation).toBeGreaterThanOrEqual(-1);
        (0, vitest_1.expect)(result.lag1Correlation).toBeLessThanOrEqual(1);
    });
    (0, vitest_1.it)('returns correlation in valid range [-1, 1]', () => {
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(syntheticDraws);
        (0, vitest_1.expect)(Math.abs(result.lag1Correlation)).toBeLessThanOrEqual(1);
    });
    (0, vitest_1.it)('classifies independent (uniform) draws correctly', () => {
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(syntheticDraws);
        // Uniform random draws should have near-zero correlation
        (0, vitest_1.expect)(Math.abs(result.lag1Correlation)).toBeLessThan(0.3);
        (0, vitest_1.expect)(result.interpretation).toBe('Independent');
        (0, vitest_1.expect)(result.isSignificant).toBe(false);
    });
    (0, vitest_1.it)('returns p-value in valid range [0, 1]', () => {
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(syntheticDraws);
        (0, vitest_1.expect)(result.pValue).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(result.pValue).toBeLessThanOrEqual(1);
    });
    (0, vitest_1.it)('sums array matches number of draws', () => {
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(syntheticDraws);
        (0, vitest_1.expect)(result.sums.length).toBe(syntheticDraws.length);
        (0, vitest_1.expect)(result.lag1Sums.length).toBe(syntheticDraws.length - 1);
    });
    (0, vitest_1.it)('detects positive autocorrelation (ascending pattern)', () => {
        // Create draws where sums are increasing (positive autocorrelation)
        const ascendingDraws = [
            { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15
            { id: 'd2', numbers: [2, 3, 4, 5, 6] }, // sum = 20
            { id: 'd3', numbers: [3, 4, 5, 6, 7] }, // sum = 25
            { id: 'd4', numbers: [4, 5, 6, 7, 8] }, // sum = 30
            { id: 'd5', numbers: [5, 6, 7, 8, 9] }, // sum = 35
            { id: 'd6', numbers: [6, 7, 8, 9, 10] }, // sum = 40
            { id: 'd7', numbers: [7, 8, 9, 10, 11] }, // sum = 45
        ];
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(ascendingDraws);
        // Should detect positive correlation
        (0, vitest_1.expect)(result.lag1Correlation).toBeGreaterThan(0.5);
        (0, vitest_1.expect)(result.interpretation).toBe('Dependent');
    });
    (0, vitest_1.it)('detects negative autocorrelation (alternating pattern)', () => {
        // Create draws with alternating high/low sums (negative autocorrelation)
        const alternatingDraws = [
            { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15 (low)
            { id: 'd2', numbers: [45, 46, 47, 48, 49] }, // sum = 235 (high)
            { id: 'd3', numbers: [2, 3, 4, 5, 6] }, // sum = 20 (low)
            { id: 'd4', numbers: [44, 45, 46, 47, 48] }, // sum = 230 (high)
            { id: 'd5', numbers: [3, 4, 5, 6, 7] }, // sum = 25 (low)
            { id: 'd6', numbers: [43, 44, 45, 46, 47] }, // sum = 225 (high)
        ];
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(alternatingDraws);
        // Should detect negative correlation
        (0, vitest_1.expect)(result.lag1Correlation).toBeLessThan(-0.5);
        (0, vitest_1.expect)(result.interpretation).toBe('Dependent');
    });
    (0, vitest_1.it)('throws on insufficient draws', () => {
        const shortDraws = [
            { id: 'd1', numbers: [1, 2, 3, 4, 5] },
            { id: 'd2', numbers: [6, 7, 8, 9, 10] },
        ];
        (0, vitest_1.expect)(() => (0, Autocorrelation_1.calculateLag1Autocorrelation)(shortDraws)).toThrow();
    });
    (0, vitest_1.it)('calculates lagged sequence correctly', () => {
        const testDraws = [
            { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15
            { id: 'd2', numbers: [10, 11, 12, 13, 14] }, // sum = 60
            { id: 'd3', numbers: [20, 21, 22, 23, 24] }, // sum = 110
        ];
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(testDraws);
        (0, vitest_1.expect)(result.sums).toEqual([15, 60, 110]);
        (0, vitest_1.expect)(result.lag1Sums).toEqual([60, 110]);
    });
    (0, vitest_1.it)('handles identical sums (zero variance)', () => {
        // All draws have the same sum - correlation should be NaN-safe (return 0)
        const identicalDraws = [
            { id: 'd1', numbers: [10, 11, 12, 13, 14] }, // sum = 60
            { id: 'd2', numbers: [10, 11, 12, 13, 14] }, // sum = 60
            { id: 'd3', numbers: [10, 11, 12, 13, 14] }, // sum = 60
        ];
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(identicalDraws);
        // When variance is 0, correlation should be 0
        (0, vitest_1.expect)(result.lag1Correlation).toBe(0);
    });
    (0, vitest_1.it)('supports Skeptical Realist persona - proves independence on uniform data', () => {
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(syntheticDraws);
        // Evidence 1: Near-zero correlation
        (0, vitest_1.expect)(Math.abs(result.lag1Correlation)).toBeLessThan(0.2);
        // Evidence 2: Not statistically significant
        (0, vitest_1.expect)(result.isSignificant).toBe(false);
        // Evidence 3: Clear "Independent" classification
        (0, vitest_1.expect)(result.interpretation).toBe('Independent');
        // Evidence 4: High p-value (no evidence of dependence)
        (0, vitest_1.expect)(result.pValue).toBeGreaterThan(0.1);
    });
    (0, vitest_1.it)('correlation is symmetric (order independent)', () => {
        const testDraws = [
            { id: 'd1', numbers: [5, 10, 15, 20, 25] }, // sum = 75
            { id: 'd2', numbers: [10, 15, 20, 25, 30] }, // sum = 100
            { id: 'd3', numbers: [15, 20, 25, 30, 35] }, // sum = 125
            { id: 'd4', numbers: [20, 25, 30, 35, 40] }, // sum = 150
        ];
        const result = (0, Autocorrelation_1.calculateLag1Autocorrelation)(testDraws);
        // Correlation should be well-defined and consistent
        (0, vitest_1.expect)(Number.isFinite(result.lag1Correlation)).toBe(true);
        (0, vitest_1.expect)(result.lag1Correlation).not.toBeNaN();
    });
    (0, vitest_1.it)('distinguishes between zero and non-zero correlation', () => {
        // Completely random draws should have near-zero correlation
        const randomDraws = [
            { id: 'd1', numbers: [3, 8, 15, 22, 40] }, // sum = 88
            { id: 'd2', numbers: [7, 19, 26, 35, 42] }, // sum = 129
            { id: 'd3', numbers: [2, 14, 28, 33, 39] }, // sum = 116
            { id: 'd4', numbers: [11, 20, 24, 37, 44] }, // sum = 136
            { id: 'd5', numbers: [1, 12, 30, 38, 48] }, // sum = 129
        ];
        const randomResult = (0, Autocorrelation_1.calculateLag1Autocorrelation)(randomDraws);
        // Compare with ascending pattern
        const ascendingDraws = [
            { id: 'd1', numbers: [1, 2, 3, 4, 5] }, // sum = 15
            { id: 'd2', numbers: [10, 11, 12, 13, 14] }, // sum = 60
            { id: 'd3', numbers: [20, 21, 22, 23, 24] }, // sum = 110
            { id: 'd4', numbers: [30, 31, 32, 33, 34] }, // sum = 160
            { id: 'd5', numbers: [40, 41, 42, 43, 44] }, // sum = 210
        ];
        const ascendingResult = (0, Autocorrelation_1.calculateLag1Autocorrelation)(ascendingDraws);
        // Ascending should have much higher correlation than random
        (0, vitest_1.expect)(ascendingResult.lag1Correlation).toBeGreaterThan(randomResult.lag1Correlation + 0.5);
    });
});
//# sourceMappingURL=autocorrelation.spec.js.map