import type { Draw } from '../Draw';
import type { GameConfig } from '../interfaces/GameConfig';
/**
 * Result of the Kolmogorov-Smirnov test.
 */
export interface KSTestResult {
    readonly dStatistic: number;
    readonly empiricalMean: number;
    readonly empiricalStdDev: number;
    readonly theoreticalMean: number;
    readonly theoreticalStdDev: number;
    readonly classification: 'Random' | 'Patterned';
    readonly sums: number[];
}
/**
 * Kolmogorov-Smirnov test for normality of draw sums.
 *
 * Process:
 * 1. Calculate the sum of numbers for each draw
 * 2. Compute theoretical mean and variance from game config
 * 3. Calculate empirical and theoretical CDFs at each sum value
 * 4. D-statistic = max|empirical CDF - theoretical CDF|
 * 5. Classify as 'Random' (D ≤ threshold) or 'Patterned' (D > threshold)
 *
 * @param draws Array of lottery draws
 * @param config Game configuration
 * @returns KSTestResult with D-statistic and classification
 */
export declare function calculateKSTest(draws: Draw[], config: GameConfig): KSTestResult;
//# sourceMappingURL=KSTest.d.ts.map