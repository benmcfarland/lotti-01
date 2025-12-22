"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const AnalyzeGame_1 = require("../../src/application/AnalyzeGame");
const AnalysisReport_1 = require("../../src/application/AnalysisReport");
/**
 * Mock repository for testing without file I/O.
 */
class MockLotteryRepository {
    records;
    constructor(records) {
        this.records = records;
    }
    async load() {
        return this.records;
    }
    async verifyIntegrity() {
        // No-op for testing
    }
}
(0, vitest_1.describe)('AnalyzeGame Application Service', () => {
    let syntheticRecords;
    let gameConfig;
    (0, vitest_1.beforeAll)(() => {
        const fixture = JSON.parse((0, fs_1.readFileSync)('tests/fixtures/synthetic_data.json', 'utf-8'));
        syntheticRecords = fixture.data.map((d) => ({
            id: `draw-${d.drawId}`,
            drawDate: '2024-01-01',
            mainNumbers: d.numbers,
        }));
        gameConfig = {
            mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        };
    });
    (0, vitest_1.it)('executes full analysis on synthetic uniform draws', async () => {
        const repo = new MockLotteryRepository(syntheticRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute('test-game-1');
        (0, vitest_1.expect)(report.gameId).toBe('test-game-1');
        (0, vitest_1.expect)(report.drawCount).toBe(syntheticRecords.length);
        (0, vitest_1.expect)(report.timestamp).toBeDefined();
    });
    (0, vitest_1.it)('returns all three test results', async () => {
        const repo = new MockLotteryRepository(syntheticRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute('test-game-1');
        (0, vitest_1.expect)(report.chiSquareTest).toBeDefined();
        (0, vitest_1.expect)(report.ksTest).toBeDefined();
        (0, vitest_1.expect)(report.autocorrelationTest).toBeDefined();
    });
    (0, vitest_1.it)('includes test names and details', async () => {
        const repo = new MockLotteryRepository(syntheticRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute('test-game-1');
        (0, vitest_1.expect)(report.chiSquareTest.name).toContain('Chi-Square');
        (0, vitest_1.expect)(report.ksTest.name).toContain('Kolmogorov');
        (0, vitest_1.expect)(report.autocorrelationTest.name).toContain('Autocorrelation');
        (0, vitest_1.expect)(report.chiSquareTest.details).toBeDefined();
        (0, vitest_1.expect)(report.ksTest.details).toBeDefined();
        (0, vitest_1.expect)(report.autocorrelationTest.details).toBeDefined();
    });
    (0, vitest_1.it)('color-codes test results with status (PASS/WARN/FAIL)', async () => {
        const repo = new MockLotteryRepository(syntheticRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute('test-game-1');
        (0, vitest_1.expect)(['PASS', 'WARN', 'FAIL']).toContain(report.chiSquareTest.status);
        (0, vitest_1.expect)(['PASS', 'WARN', 'FAIL']).toContain(report.ksTest.status);
        (0, vitest_1.expect)(['PASS', 'WARN', 'FAIL']).toContain(report.autocorrelationTest.status);
    });
    (0, vitest_1.it)('classifies uniform draws as overall PASS', async () => {
        const repo = new MockLotteryRepository(syntheticRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute('test-game-1');
        // Synthetic uniform data should pass all tests
        (0, vitest_1.expect)(report.overallStatus).toBe('PASS');
        (0, vitest_1.expect)(report.overallInterpretation).toContain('random');
    });
    (0, vitest_1.it)('provides meaningful summary text', async () => {
        const repo = new MockLotteryRepository(syntheticRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute('test-game-1');
        (0, vitest_1.expect)(report.summary).toBeDefined();
        (0, vitest_1.expect)(report.summary.length).toBeGreaterThan(10);
        (0, vitest_1.expect)(report.summary).toContain(String(syntheticRecords.length));
    });
    (0, vitest_1.it)('includes statistics in test results', async () => {
        const repo = new MockLotteryRepository(syntheticRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute('test-game-1');
        (0, vitest_1.expect)(typeof report.chiSquareTest.statistic).toBe('number');
        (0, vitest_1.expect)(typeof report.ksTest.statistic).toBe('number');
        (0, vitest_1.expect)(typeof report.autocorrelationTest.statistic).toBe('number');
        (0, vitest_1.expect)(typeof report.chiSquareTest.pValue).toBe('number');
        (0, vitest_1.expect)(typeof report.ksTest.pValue).toBe('number');
        (0, vitest_1.expect)(typeof report.autocorrelationTest.pValue).toBe('number');
    });
    (0, vitest_1.it)('throws on empty repository', async () => {
        const repo = new MockLotteryRepository([]);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        await (0, vitest_1.expect)(service.execute('test-game-empty')).rejects.toThrow();
    });
    (0, vitest_1.it)('determines status correctly based on p-value', () => {
        // PASS: p > 0.05
        (0, vitest_1.expect)((0, AnalysisReport_1.determineStatus)(0.5, false)).toBe('PASS');
        (0, vitest_1.expect)((0, AnalysisReport_1.determineStatus)(0.06, false)).toBe('PASS');
        // WARN: 0.01 < p <= 0.05
        (0, vitest_1.expect)((0, AnalysisReport_1.determineStatus)(0.03, true)).toBe('WARN');
        // FAIL: p <= 0.01
        (0, vitest_1.expect)((0, AnalysisReport_1.determineStatus)(0.005, true)).toBe('FAIL');
        (0, vitest_1.expect)((0, AnalysisReport_1.determineStatus)(0.001, true)).toBe('FAIL');
    });
    (0, vitest_1.it)('aggregates statuses correctly', () => {
        (0, vitest_1.expect)((0, AnalysisReport_1.aggregateStatus)(['PASS', 'PASS', 'PASS'])).toBe('PASS');
        (0, vitest_1.expect)((0, AnalysisReport_1.aggregateStatus)(['PASS', 'WARN', 'PASS'])).toBe('WARN');
        (0, vitest_1.expect)((0, AnalysisReport_1.aggregateStatus)(['FAIL', 'PASS', 'PASS'])).toBe('FAIL');
        (0, vitest_1.expect)((0, AnalysisReport_1.aggregateStatus)(['WARN', 'FAIL', 'PASS'])).toBe('FAIL');
    });
    (0, vitest_1.it)('includes interpretation for each test', async () => {
        const repo = new MockLotteryRepository(syntheticRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute('test-game-1');
        (0, vitest_1.expect)(report.chiSquareTest.interpretation).toBeDefined();
        (0, vitest_1.expect)(report.ksTest.interpretation).toBeDefined();
        (0, vitest_1.expect)(report.autocorrelationTest.interpretation).toBeDefined();
        // Autocorrelation should mention Independent or Dependent
        (0, vitest_1.expect)(['Independent', 'Dependent']).toContain(report.autocorrelationTest.interpretation);
    });
    (0, vitest_1.it)('correctly converts records to draws', async () => {
        const testRecords = [
            {
                id: 'draw-1',
                drawDate: '2024-01-01',
                mainNumbers: [5, 10, 15, 20, 25],
            },
            {
                id: 'draw-2',
                drawDate: '2024-01-02',
                mainNumbers: [6, 11, 16, 21, 26],
            },
            {
                id: 'draw-3',
                drawDate: '2024-01-03',
                mainNumbers: [7, 12, 17, 22, 27],
            },
        ];
        const repo = new MockLotteryRepository(testRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute('test-game-conversion');
        // Should analyze all three draws without error
        (0, vitest_1.expect)(report.drawCount).toBe(3);
        (0, vitest_1.expect)(report.overallStatus).toBeDefined();
    });
    (0, vitest_1.it)('reports different results for different data patterns', async () => {
        // Uniform data
        const uniformRepo = new MockLotteryRepository(syntheticRecords);
        const service1 = new AnalyzeGame_1.AnalyzeGame(uniformRepo, gameConfig);
        const report1 = await service1.execute('uniform');
        // Patterned data (all same sums)
        const patternedRecords = Array(30)
            .fill(null)
            .map((_, i) => ({
            id: `draw-${i}`,
            drawDate: '2024-01-01',
            mainNumbers: [10, 11, 12, 13, 14], // Always sum to 60
        }));
        const patternedRepo = new MockLotteryRepository(patternedRecords);
        const service2 = new AnalyzeGame_1.AnalyzeGame(patternedRepo, gameConfig);
        const report2 = await service2.execute('patterned');
        // Patterned data should have worse overall status
        (0, vitest_1.expect)(report2.overallStatus).not.toBe('PASS');
    });
    (0, vitest_1.it)('includes game metadata in report', async () => {
        const gameId = 'powerball-2024';
        const repo = new MockLotteryRepository(syntheticRecords);
        const service = new AnalyzeGame_1.AnalyzeGame(repo, gameConfig);
        const report = await service.execute(gameId);
        (0, vitest_1.expect)(report.gameId).toBe(gameId);
        (0, vitest_1.expect)(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        (0, vitest_1.expect)(report.drawCount).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=analyzeGame.spec.js.map