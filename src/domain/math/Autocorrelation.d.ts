import type { Draw } from '../Draw';
/**
 * Lag-1 Autocorrelation test result.
 * Measures the correlation between consecutive draw sums.
 * Values near 0 indicate independence (random draws).
 * Values near ±1 indicate dependence (patterned draws).
 */
export interface AutocorrelationResult {
    readonly lag1Correlation: number;
    readonly pValue: number;
    readonly isSignificant: boolean;
    readonly interpretation: 'Independent' | 'Dependent';
    readonly sums: number[];
    readonly lag1Sums: number[];
}
/**
 * Calculate Lag-1 Autocorrelation to test for independence between consecutive draws.
 *
 * Process:
 * 1. Calculate sum of each draw
 * 2. Create two sequences: sums[0..n-2] and sums[1..n-1] (lagged by 1)
 * 3. Calculate Pearson correlation between the two sequences
 * 4. Compute p-value using Fisher's t-test
 * 5. Classify as 'Independent' (r ≈ 0) or 'Dependent' (r significantly ≠ 0)
 *
 * Interpretation:
 * - r ≈ 0: draws are independent (desired for random lottery)
 * - r > 0: positive correlation (e.g., high sums tend to follow high sums)
 * - r < 0: negative correlation (e.g., low sums tend to follow high sums)
 * - |r| > 0.3 with p < 0.05: statistically significant dependence
 *
 * @param draws Array of lottery draws
 * @returns AutocorrelationResult with correlation, p-value, and interpretation
 */
export declare function calculateLag1Autocorrelation(draws: Draw[]): AutocorrelationResult;
//# sourceMappingURL=Autocorrelation.d.ts.map