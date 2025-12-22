"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeGame = void 0;
const ChiSquare_1 = require("../domain/math/ChiSquare");
const KSTest_1 = require("../domain/math/KSTest");
const Autocorrelation_1 = require("../domain/math/Autocorrelation");
const AnalysisReport_1 = require("./AnalysisReport");
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
class AnalyzeGame {
    repository;
    gameConfig;
    constructor(repository, gameConfig) {
        this.repository = repository;
        this.gameConfig = gameConfig;
    }
    /**
     * Execute the analysis workflow.
     * Loads history and runs all statistical tests.
     *
     * @param gameId Identifier for the game being analyzed
     * @returns AnalysisReport with aggregated test results
     */
    async execute(gameId) {
        // Step 1: Load draw history
        const records = await this.repository.load();
        // Step 2: Convert repository records to domain Draw objects
        const draws = records.map((record) => ({
            id: record.id,
            numbers: record.mainNumbers,
        }));
        if (draws.length === 0) {
            throw new Error('No draws found in repository');
        }
        // Step 3: Execute domain tests
        const chiSquareResult = (0, ChiSquare_1.calculateChiSquare)(draws, this.gameConfig);
        const ksResult = (0, KSTest_1.calculateKSTest)(draws, this.gameConfig);
        const acfResult = (0, Autocorrelation_1.calculateLag1Autocorrelation)(draws);
        // Step 4: Create individual test results with color coding
        const chiSquareTest = {
            name: 'Chi-Square Goodness-of-Fit',
            status: (0, AnalysisReport_1.determineStatus)(chiSquareResult.pValue, chiSquareResult.pValue < 0.05),
            statistic: chiSquareResult.chiSquareStatistic,
            pValue: chiSquareResult.pValue,
            interpretation: `χ² = ${chiSquareResult.chiSquareStatistic.toFixed(4)}, df = ${chiSquareResult.degreesOfFreedom}`,
            details: 'Tests if individual number frequencies match uniform distribution (10 decile bins)',
        };
        const ksTest = {
            name: 'Kolmogorov-Smirnov Normality',
            status: (0, AnalysisReport_1.determineStatus)(1 - ksResult.dStatistic, ksResult.dStatistic > 0.2),
            statistic: ksResult.dStatistic,
            pValue: 1 - ksResult.dStatistic, // Approximate p-value from D-statistic
            interpretation: ksResult.classification,
            details: `Tests if sum distribution matches normal. D = ${ksResult.dStatistic.toFixed(4)}, μ = ${ksResult.theoreticalMean.toFixed(1)}, σ = ${ksResult.theoreticalStdDev.toFixed(2)}`,
        };
        const autocorrelationTest = {
            name: 'Lag-1 Autocorrelation',
            status: (0, AnalysisReport_1.determineStatus)(acfResult.pValue, acfResult.isSignificant),
            statistic: acfResult.lag1Correlation,
            pValue: acfResult.pValue,
            interpretation: acfResult.interpretation,
            details: `Tests independence between consecutive draws. r = ${acfResult.lag1Correlation.toFixed(4)}, p = ${acfResult.pValue.toFixed(6)}`,
        };
        // Step 5: Aggregate results
        const testStatuses = [chiSquareTest.status, ksTest.status, autocorrelationTest.status];
        const overallStatus = (0, AnalysisReport_1.aggregateStatus)(testStatuses);
        const overallInterpretation = overallStatus === 'PASS'
            ? 'Draws appear random and independent'
            : overallStatus === 'WARN'
                ? 'Some statistical anomalies detected; monitor closely'
                : 'Strong evidence of non-random patterns detected';
        const summary = overallStatus === 'PASS'
            ? `All tests passed. The ${draws.length} draws analyzed show no statistically significant deviation from randomness.`
            : overallStatus === 'WARN'
                ? `One or more tests show potential patterns. Of ${draws.length} draws, the distribution warrants further investigation.`
                : `Critical findings. Multiple tests indicate non-random behavior in the ${draws.length} draws analyzed.`;
        const timestamp = new Date().toISOString();
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
        };
    }
}
exports.AnalyzeGame = AnalyzeGame;
//# sourceMappingURL=AnalyzeGame.js.map