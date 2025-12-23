import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { createHash } from 'crypto'
import { CsvLotteryRepository } from '../../src/infrastructure/CsvLotteryRepository'

describe('CsvLotteryRepository with SHA-256 integrity', () => {
  const testDir = '/tmp/lotti-test'
  const testFile = `${testDir}/lottery.csv`

  const csvContent = `id,drawDate,mainNumbers,bonusNumber
draw-001,2023-01-15,"1,2,3,4,5,6",7
draw-002,2023-01-22,"8,9,10,11,12,13",14
draw-003,2023-02-05,"15,16,17,18,19,20",21`

  let csvHash: string

  beforeAll(() => {
    // Create test directory and file
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
    writeFileSync(testFile, csvContent, 'utf-8')
    csvHash = createHash('sha256').update(csvContent).digest('hex')
  })

  afterAll(() => {
    try {
      unlinkSync(testFile)
    } catch (e) {
      // file may be gone
    }
  })

  it('loads CSV records successfully', async () => {
    const repo = new CsvLotteryRepository(testFile)
    const records = await repo.load()

    expect(records.length).toBe(3)
    expect(records[0]?.id).toBe('draw-001')
    expect(records[0]?.drawDate).toBe('2023-01-15')
    expect(records[0]?.mainNumbers.length).toBe(6)
  })

  it('computes file hash on load', async () => {
    const repo = new CsvLotteryRepository(testFile)
    await repo.load()
    const hash = repo.getHash()

    expect(hash).toBe(csvHash)
  })

  it('verifies integrity with matching hash', async () => {
    const repo = new CsvLotteryRepository(testFile, csvHash)
    // Should not throw
    await expect(repo.load()).resolves.toBeDefined()
  })

  it('throws on hash mismatch', async () => {
    const wrongHash = 'deadbeef0000000000000000000000000000000000000000000000000000beef'
    const repo = new CsvLotteryRepository(testFile, wrongHash)

    await expect(repo.load()).rejects.toThrow('CSV integrity check failed')
  })

  it('parses bonus numbers when present', async () => {
    const repo = new CsvLotteryRepository(testFile)
    const records = await repo.load()

    expect(records[0]?.bonusNumber).toBe(7)
    expect(records[1]?.bonusNumber).toBe(14)
  })
})
