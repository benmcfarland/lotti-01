/**
 * Statistical analysis status with color coding.
 * Used for visual representation of test results.
 */
export type TestStatus = 'PASS' | 'WARN' | 'FAIL'

/**
 * Individual test result with status and interpretation.
 */
export interface TestResult {
  readonly name: string
  readonly status: TestStatus
  readonly statistic: number
  readonly pValue: number
  readonly interpretation: string
  readonly details: string
}

/**
 * Aggregated analysis report for a lottery game.
 * Contains results from Chi-Square, Kolmogorov-Smirnov, and Autocorrelation tests.
 * Color-coded status indicates overall randomness quality.
 */
export interface AnalysisReport {
  readonly gameId: string
  readonly timestamp: string
  readonly drawCount: number
  readonly overallStatus: TestStatus
  readonly overallInterpretation: string
  readonly chiSquareTest: TestResult
  readonly ksTest: TestResult
  readonly autocorrelationTest: TestResult
  readonly summary: string
}

/**
 * Determine test status based on p-value and interpretation.
 * PASS: p-value > 0.05 (statistically consistent with randomness)
 * WARN: p-value 0.01-0.05 (borderline, possible pattern)
 * FAIL: p-value < 0.01 (strong evidence of non-randomness)
 */
export function determineStatus(pValue: number, isSignificant: boolean): TestStatus {
  if (pValue > 0.05 || !isSignificant) {
    return 'PASS'
  } else if (pValue > 0.01) {
    return 'WARN'
  } else {
    return 'FAIL'
  }
}

/**
 * Calculate overall status from individual test results.
 * FAIL if any test fails
 * WARN if any test warns
 * PASS if all tests pass
 */
export function aggregateStatus(statuses: TestStatus[]): TestStatus {
  if (statuses.includes('FAIL')) return 'FAIL'
  if (statuses.includes('WARN')) return 'WARN'
  return 'PASS'
}
