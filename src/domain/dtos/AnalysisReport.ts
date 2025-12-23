/**
 * Status mapping based on statistical significance of p-values.
 * - Significant: p-value < 0.05 (statistically unlikely under randomness assumption)
 * - Normal: p-value 0.05-0.10 (borderline, needs further investigation)
 * - Suspicious: p-value >= 0.10 (consistent with randomness, no anomaly detected)
 */
export type AnalysisStatus = 'Significant' | 'Normal' | 'Suspicious'

/**
 * Result of Chi-Square goodness-of-fit test (Decile Binning).
 */
export interface ChiSquareResult {
  readonly chiSquareStatistic: number
  readonly degreesOfFreedom: number
  readonly pValue: number
  readonly binObserved: readonly number[]
  readonly binExpected: readonly number[]
}

/**
 * Result of Kolmogorov-Smirnov normality test.
 */
export interface KSTestResult {
  readonly dStatistic: number
  readonly empiricalMean: number
  readonly theoreticalMean: number
  readonly pValue: number
  readonly classification: 'Random' | 'Patterned'
}

/**
 * Result of Lag-1 Autocorrelation test for independence.
 */
export interface AutocorrelationResult {
  readonly lag1Correlation: number
  readonly pValue: number
  readonly isSignificant: boolean
  readonly interpretation: 'Independent' | 'Dependent'
}

/**
 * Complete statistical analysis for a single pool (main or bonus).
 * Contains results from three statistical tests with aggregated status.
 */
export interface PoolAnalysis {
  readonly chiSquare: ChiSquareResult
  readonly ksTest: KSTestResult
  readonly autocorrelation: AutocorrelationResult
  readonly status: AnalysisStatus
}

/**
 * Complete analysis report separating main pool and bonus pool analysis.
 * Each pool is analyzed independently for randomness and independence.
 */
export interface AnalysisReport {
  readonly gameId: string
  readonly timestamp: string
  readonly drawCount: number
  readonly mainPoolAnalysis: PoolAnalysis
  readonly bonusPoolAnalysis: PoolAnalysis
  readonly overallStatus: AnalysisStatus
}

/**
 * Determine status based on p-value threshold.
 * - Significant: p < 0.05 (evidence of non-randomness)
 * - Normal: 0.05 ≤ p < 0.10 (borderline region)
 * - Suspicious: p ≥ 0.10 (insufficient evidence of pattern)
 */
export function determinePoolStatus(pValues: readonly number[]): AnalysisStatus {
  // Use the minimum p-value from the three tests (most conservative)
  const minPValue = Math.min(...pValues)

  if (minPValue < 0.05) {
    return 'Significant'
  } else if (minPValue < 0.1) {
    return 'Normal'
  } else {
    return 'Suspicious'
  }
}

/**
 * Determine overall status from both pool statuses.
 * Overall status is the most critical of the two pools.
 * Priority: Significant > Normal > Suspicious
 */
export function determineOverallStatus(
  mainPoolStatus: AnalysisStatus,
  bonusPoolStatus: AnalysisStatus
): AnalysisStatus {
  if (mainPoolStatus === 'Significant' || bonusPoolStatus === 'Significant') {
    return 'Significant'
  }
  if (mainPoolStatus === 'Normal' || bonusPoolStatus === 'Normal') {
    return 'Normal'
  }
  return 'Suspicious'
}
