"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateLag1Autocorrelation = calculateLag1Autocorrelation;
/**
 * Calculate Pearson correlation coefficient between two sequences.
 * r = Σ((x_i - mean_x)(y_i - mean_y)) / sqrt(Σ(x_i - mean_x)² * Σ(y_i - mean_y)²)
 */
function pearsonCorrelation(x, y) {
    if (x.length !== y.length || x.length < 2) {
        throw new Error('Sequences must have equal length and at least 2 elements');
    }
    const n = x.length;
    // Calculate means
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    // Calculate deviations and products
    let sumDevProd = 0;
    let sumDevX2 = 0;
    let sumDevY2 = 0;
    for (let i = 0; i < n; i++) {
        const devX = x[i] - meanX;
        const devY = y[i] - meanY;
        sumDevProd += devX * devY;
        sumDevX2 += devX * devX;
        sumDevY2 += devY * devY;
    }
    // Avoid division by zero
    if (sumDevX2 === 0 || sumDevY2 === 0) {
        return 0;
    }
    return sumDevProd / Math.sqrt(sumDevX2 * sumDevY2);
}
/**
 * Approximate p-value for correlation coefficient using Fisher's t-test.
 * For Pearson correlation r with n samples:
 * t = r * sqrt(n - 2) / sqrt(1 - r²)
 * p-value ≈ 2 * P(T > |t|) where T is t-distribution with df = n - 2
 *
 * Uses normal approximation for p-value calculation.
 */
function correlationPValue(r, n) {
    if (n < 3)
        return 1;
    // Avoid division by zero
    const r2 = r * r;
    if (r2 >= 1)
        return 0;
    const t = r * Math.sqrt(n - 2) / Math.sqrt(1 - r2);
    const tAbs = Math.abs(t);
    // Use normal approximation for t-distribution with df >= 30
    // P(T > t) ≈ P(Z > t) using standard normal
    // For smaller df, this is a conservative approximation
    const zValue = Math.min(tAbs, 6); // Cap at 6 to avoid overflow
    const pValue = 2 * (1 - normalCDF(zValue));
    return Math.max(pValue, 0);
}
/**
 * Standard normal CDF approximation Φ(x) using error function.
 */
function normalCDF(x) {
    // Abramowitz and Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1 / (1 + p * absX);
    const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
    return 0.5 * (1 + sign * y);
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
function calculateLag1Autocorrelation(draws) {
    if (!draws || draws.length < 3) {
        throw new Error('draws array must have at least 3 elements for Lag-1 autocorrelation');
    }
    // Step 1: Calculate sum for each draw
    const sums = draws.map((draw) => draw.numbers.reduce((a, b) => a + b, 0));
    // Step 2: Create lagged sequences
    const x = sums.slice(0, -1); // sums[0..n-2]
    const y = sums.slice(1); // sums[1..n-1]
    // Step 3: Calculate Pearson correlation
    const lag1Correlation = pearsonCorrelation(x, y);
    // Step 4: Calculate p-value
    const pValue = correlationPValue(lag1Correlation, x.length);
    // Step 5: Classify as significant/non-significant
    // Use α = 0.05 and effect size threshold |r| > 0.3
    const isSignificant = pValue < 0.05 && Math.abs(lag1Correlation) > 0.3;
    const interpretation = isSignificant ? 'Dependent' : 'Independent';
    return {
        lag1Correlation,
        pValue,
        isSignificant,
        interpretation,
        sums,
        lag1Sums: y,
    };
}
//# sourceMappingURL=Autocorrelation.js.map