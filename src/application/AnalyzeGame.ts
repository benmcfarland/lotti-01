import { calculateChiSquare } from '../domain/math/ChiSquare'
import { calculateKSTest } from '../domain/math/KSTest'
import { calculateLag1Autocorrelation } from '../domain/math/Autocorrelation'
import type { ILotteryRepository, LotteryRecord } from '../domain/ILotteryRepository'
import type { GameConfig } from '../domain/interfaces/GameConfig'
import type { Draw } from '../domain/Draw'
import type { AnalysisReport, TestResult } from './AnalysisReport'
import { determineStatus, aggregateStatus } from './AnalysisReport'

/**
 * AnalyzeGame application service.
 *
 * Orchestrates the statistical analysis workflow:
 * 1. Load draw history from repository
 * 2. Execute Chi-Square, K-S, and Autocorrelation domain tests
 * 3. Aggregate results into a comprehensive report
 *
 * Dependency injection: repository and config are provided by the caller.
 */
export class AnalyzeGame {
  constructor(private readonly repository: ILotteryRepository, private readonly gameConfig: GameConfig) {}

  /**
   * Execute the analysis workflow.
   * Loads history and runs all statistical tests.
   *
   * @param gameId Identifier for the game being analyzed
   * @returns AnalysisReport with aggregated test results
   */
  async execute(gameId: string): Promise<AnalysisReport> {
    // Step 1: Load draw history
    const records = await this.repository.load()

    // Step 2: Convert repository records to domain Draw objects
    const draws: Draw[] = records.map((record: LotteryRecord) => ({
      id: record.id,
      numbers: record.mainNumbers,
    }))

    if (draws.length === 0) {
      throw new Error('No draws found in repository')
    }

    // Step 3: Execute domain tests
    const chiSquareResult = calculateChiSquare(draws, this.gameConfig)
    const ksResult = calculateKSTest(draws, this.gameConfig)
    const acfResult = calculateLag1Autocorrelation(draws)

    // Step 4: Create individual test results with color coding
    const chiSquareTest: TestResult = {
      name: 'Chi-Square Goodness-of-Fit',
      status: determineStatus(chiSquareResult.pValue, chiSquareResult.pValue < 0.05),
      statistic: chiSquareResult.chiSquareStatistic,
      pValue: chiSquareResult.pValue,
      interpretation: `χ² = ${chiSquareResult.chiSquareStatistic.toFixed(4)}, df = ${chiSquareResult.degreesOfFreedom}`,
      details: 'Tests if individual number frequencies match uniform distribution (10 decile bins)',
    }

    const ksTest: TestResult = {
      name: 'Kolmogorov-Smirnov Normality',
      status: determineStatus(1 - ksResult.dStatistic, ksResult.dStatistic > 0.2),
      statistic: ksResult.dStatistic,
      pValue: 1 - ksResult.dStatistic, // Approximate p-value from D-statistic
      interpretation: ksResult.classification,
      details: `Tests if sum distribution matches normal. D = ${ksResult.dStatistic.toFixed(4)}, μ = ${ksResult.theoreticalMean.toFixed(1)}, σ = ${ksResult.theoreticalStdDev.toFixed(2)}`,
    }

    const autocorrelationTest: TestResult = {
      name: 'Lag-1 Autocorrelation',
      status: determineStatus(acfResult.pValue, acfResult.isSignificant),
      statistic: acfResult.lag1Correlation,
      pValue: acfResult.pValue,
      interpretation: acfResult.interpretation,
      details: `Tests independence between consecutive draws. r = ${acfResult.lag1Correlation.toFixed(4)}, p = ${acfResult.pValue.toFixed(6)}`,
    }

    // Step 5: Aggregate results
    const testStatuses = [chiSquareTest.status, ksTest.status, autocorrelationTest.status]
    const overallStatus = aggregateStatus(testStatuses)

    const overallInterpretation =
      overallStatus === 'PASS'
        ? 'Draws appear random and independent'
        : overallStatus === 'WARN'
          ? 'Some statistical anomalies detected; monitor closely'
          : 'Strong evidence of non-random patterns detected'

    const summary =
      overallStatus === 'PASS'
        ? `All tests passed. The ${draws.length} draws analyzed show no statistically significant deviation from randomness.`
        : overallStatus === 'WARN'
          ? `One or more tests show potential patterns. Of ${draws.length} draws, the distribution warrants further investigation.`
          : `Critical findings. Multiple tests indicate non-random behavior in the ${draws.length} draws analyzed.`

    const timestamp = new Date().toISOString()

    return {
      gameId,
      timestamp,
      drawCount: draws.length,
      overallStatus,
      overallInterpretation,
      chiSquareTest,
      ksTest,
      autocorrelationTest,
      summary,
    }
  }
}
