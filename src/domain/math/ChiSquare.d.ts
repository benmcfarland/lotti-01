import type { Draw } from '../Draw';
import type { GameConfig } from '../interfaces/GameConfig';
/**
 * Chi-Square test result object.
 */
export interface ChiSquareResult {
    readonly chiSquareStatistic: number;
    readonly degreesOfFreedom: number;
    readonly pValue: number;
    readonly binObserved: number[];
    readonly binExpected: number[];
}
/**
 * Calculate Chi-Square statistic using Decile Binning to handle small sample sizes.
 *
 * Process:
 * 1. Divide the range [minNumber, maxNumber] into 10 equal-width bins (deciles)
 * 2. Count observed frequency for each bin across all draws
 * 3. Calculate expected frequency (uniform distribution)
 * 4. Compute Chi-Square: Σ((observed - expected)² / expected)
 * 5. Return statistic, degrees of freedom (9), and p-value
 *
 * @param draws Array of lottery draws
 * @param config Game configuration with pool range and count
 * @returns ChiSquareResult with statistic, df, p-value, and bin frequencies
 */
export declare function calculateChiSquare(draws: Draw[], config: GameConfig): ChiSquareResult;
//# sourceMappingURL=ChiSquare.d.ts.map