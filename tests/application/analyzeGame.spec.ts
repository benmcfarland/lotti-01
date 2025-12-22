import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { AnalyzeGame } from '../../src/application/AnalyzeGame'
import type { ILotteryRepository, LotteryRecord } from '../../src/domain/ILotteryRepository'
import type { GameConfig } from '../../src/domain/interfaces/GameConfig'
import { determineStatus, aggregateStatus } from '../../src/application/AnalysisReport'

/**
 * Mock repository for testing without file I/O.
 */
class MockLotteryRepository implements ILotteryRepository {
  constructor(private records: LotteryRecord[]) {}

  async load(): Promise<LotteryRecord[]> {
    return this.records
  }

  async verifyIntegrity(): Promise<void> {
    // No-op for testing
  }
}

describe('AnalyzeGame Application Service', () => {
  let syntheticRecords: LotteryRecord[]
  let gameConfig: GameConfig

  beforeAll(() => {
    const fixture = JSON.parse(readFileSync('tests/fixtures/synthetic_data.json', 'utf-8'))
    syntheticRecords = fixture.data.map(
      (d: { drawId: number; numbers: number[] }) => ({
        id: `draw-${d.drawId}`,
        drawDate: '2024-01-01',
        mainNumbers: d.numbers,
      })
    )
    gameConfig = {
      mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
    }
  })

  it('executes full analysis on synthetic uniform draws', async () => {
    const repo = new MockLotteryRepository(syntheticRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute('test-game-1')

    expect(report.gameId).toBe('test-game-1')
    expect(report.drawCount).toBe(syntheticRecords.length)
    expect(report.timestamp).toBeDefined()
  })

  it('returns all three test results', async () => {
    const repo = new MockLotteryRepository(syntheticRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute('test-game-1')

    expect(report.chiSquareTest).toBeDefined()
    expect(report.ksTest).toBeDefined()
    expect(report.autocorrelationTest).toBeDefined()
  })

  it('includes test names and details', async () => {
    const repo = new MockLotteryRepository(syntheticRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute('test-game-1')

    expect(report.chiSquareTest.name).toContain('Chi-Square')
    expect(report.ksTest.name).toContain('Kolmogorov')
    expect(report.autocorrelationTest.name).toContain('Autocorrelation')

    expect(report.chiSquareTest.details).toBeDefined()
    expect(report.ksTest.details).toBeDefined()
    expect(report.autocorrelationTest.details).toBeDefined()
  })

  it('color-codes test results with status (PASS/WARN/FAIL)', async () => {
    const repo = new MockLotteryRepository(syntheticRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute('test-game-1')

    expect(['PASS', 'WARN', 'FAIL']).toContain(report.chiSquareTest.status)
    expect(['PASS', 'WARN', 'FAIL']).toContain(report.ksTest.status)
    expect(['PASS', 'WARN', 'FAIL']).toContain(report.autocorrelationTest.status)
  })

  it('classifies uniform draws as overall PASS', async () => {
    const repo = new MockLotteryRepository(syntheticRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute('test-game-1')

    // Synthetic uniform data should pass all tests
    expect(report.overallStatus).toBe('PASS')
    expect(report.overallInterpretation).toContain('random')
  })

  it('provides meaningful summary text', async () => {
    const repo = new MockLotteryRepository(syntheticRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute('test-game-1')

    expect(report.summary).toBeDefined()
    expect(report.summary.length).toBeGreaterThan(10)
    expect(report.summary).toContain(String(syntheticRecords.length))
  })

  it('includes statistics in test results', async () => {
    const repo = new MockLotteryRepository(syntheticRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute('test-game-1')

    expect(typeof report.chiSquareTest.statistic).toBe('number')
    expect(typeof report.ksTest.statistic).toBe('number')
    expect(typeof report.autocorrelationTest.statistic).toBe('number')

    expect(typeof report.chiSquareTest.pValue).toBe('number')
    expect(typeof report.ksTest.pValue).toBe('number')
    expect(typeof report.autocorrelationTest.pValue).toBe('number')
  })

  it('throws on empty repository', async () => {
    const repo = new MockLotteryRepository([])
    const service = new AnalyzeGame(repo, gameConfig)

    await expect(service.execute('test-game-empty')).rejects.toThrow()
  })

  it('determines status correctly based on p-value', () => {
    // PASS: p > 0.05
    expect(determineStatus(0.5, false)).toBe('PASS')
    expect(determineStatus(0.06, false)).toBe('PASS')

    // WARN: 0.01 < p <= 0.05
    expect(determineStatus(0.03, true)).toBe('WARN')

    // FAIL: p <= 0.01
    expect(determineStatus(0.005, true)).toBe('FAIL')
    expect(determineStatus(0.001, true)).toBe('FAIL')
  })

  it('aggregates statuses correctly', () => {
    expect(aggregateStatus(['PASS', 'PASS', 'PASS'])).toBe('PASS')
    expect(aggregateStatus(['PASS', 'WARN', 'PASS'])).toBe('WARN')
    expect(aggregateStatus(['FAIL', 'PASS', 'PASS'])).toBe('FAIL')
    expect(aggregateStatus(['WARN', 'FAIL', 'PASS'])).toBe('FAIL')
  })

  it('includes interpretation for each test', async () => {
    const repo = new MockLotteryRepository(syntheticRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute('test-game-1')

    expect(report.chiSquareTest.interpretation).toBeDefined()
    expect(report.ksTest.interpretation).toBeDefined()
    expect(report.autocorrelationTest.interpretation).toBeDefined()

    // Autocorrelation should mention Independent or Dependent
    expect(['Independent', 'Dependent']).toContain(report.autocorrelationTest.interpretation)
  })

  it('correctly converts records to draws', async () => {
    const testRecords: LotteryRecord[] = [
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
    ]

    const repo = new MockLotteryRepository(testRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute('test-game-conversion')

    // Should analyze all three draws without error
    expect(report.drawCount).toBe(3)
    expect(report.overallStatus).toBeDefined()
  })

  it('reports different results for different data patterns', async () => {
    // Uniform data
    const uniformRepo = new MockLotteryRepository(syntheticRecords)
    const service1 = new AnalyzeGame(uniformRepo, gameConfig)
    const report1 = await service1.execute('uniform')

    // Patterned data (all same sums)
    const patternedRecords: LotteryRecord[] = Array(30)
      .fill(null)
      .map((_, i) => ({
        id: `draw-${i}`,
        drawDate: '2024-01-01',
        mainNumbers: [10, 11, 12, 13, 14], // Always sum to 60
      }))

    const patternedRepo = new MockLotteryRepository(patternedRecords)
    const service2 = new AnalyzeGame(patternedRepo, gameConfig)
    const report2 = await service2.execute('patterned')

    // Patterned data should have worse overall status
    expect(report2.overallStatus).not.toBe('PASS')
  })

  it('includes game metadata in report', async () => {
    const gameId = 'powerball-2024'
    const repo = new MockLotteryRepository(syntheticRecords)
    const service = new AnalyzeGame(repo, gameConfig)

    const report = await service.execute(gameId)

    expect(report.gameId).toBe(gameId)
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(report.drawCount).toBeGreaterThan(0)
  })
})
