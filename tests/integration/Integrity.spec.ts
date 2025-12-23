import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { writeFileSync, appendFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { createHash } from 'crypto'
import { CsvLotteryRepository } from '../../src/infrastructure/CsvLotteryRepository'
import type { LotteryRecord } from '../../src/domain/ILotteryRepository'

/**
 * Helper function to create CSV content from records
 */
function createCsvContent(records: LotteryRecord[]): string {
  const header = 'id,drawDate,mainNumbers,bonusNumber\n'
  const lines = records.map(r => {
    const mainStr = r.mainNumbers.join(',')
    const bonusStr = r.bonusNumber ? r.bonusNumber.toString() : ''
    return `${r.id},${r.drawDate},"${mainStr}",${bonusStr}`
  })
  return header + lines.join('\n')
}

/**
 * Helper function to compute SHA-256 hash of content
 */
function computeHash(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex')
}

describe('CSV Repository Integrity Integration Test', () => {
  const testDir = '/tmp/lotti-integrity-test'
  const testFile = `${testDir}/lottery_integrity.csv`

  const testRecords: LotteryRecord[] = [
    {
      id: 'draw-001',
      drawDate: '2024-01-01',
      mainNumbers: [1, 2, 3, 4, 5],
    },
    {
      id: 'draw-002',
      drawDate: '2024-01-02',
      mainNumbers: [10, 15, 20, 25, 30],
    },
    {
      id: 'draw-003',
      drawDate: '2024-01-03',
      mainNumbers: [5, 10, 15, 20, 25],
    },
  ]

  beforeAll(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
  })

  afterAll(() => {
    // Cleanup test files
    try {
      if (existsSync(testFile)) {
        unlinkSync(testFile)
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  })

  it('saves and verifies lottery records with SHA-256 hash', async () => {
    const content = createCsvContent(testRecords)
    const hash = computeHash(content)

    // Write the CSV file
    writeFileSync(testFile, content, 'utf-8')

    expect(hash).toBeDefined()
    expect(hash.length).toBe(64) // SHA-256 hex = 64 chars
    expect(existsSync(testFile)).toBe(true)

    // Verify we can load it back
    const repo = new CsvLotteryRepository(testFile, hash)
    await expect(repo.load()).resolves.not.toThrow()
  })

  it('loads saved records successfully', async () => {
    const content = createCsvContent(testRecords)
    writeFileSync(testFile, content, 'utf-8')

    const repo = new CsvLotteryRepository(testFile)
    const loaded = await repo.load()

    expect(loaded.length).toBe(3)
    expect(loaded[0]?.id).toBe('draw-001')
    expect(loaded[0]?.mainNumbers).toEqual([1, 2, 3, 4, 5])
  })

  it('detects file corruption via SHA-256 mismatch', async () => {
    const content = createCsvContent(testRecords)
    const originalHash = computeHash(content)

    // Write with valid hash
    writeFileSync(testFile, content, 'utf-8')

    // Corrupt the file by appending fake data (bypassing repository)
    const corruptedLine = 'draw-999,2024-12-31,"99,99,99,99,99",99\n'
    appendFileSync(testFile, corruptedLine, 'utf-8')

    // Now try to load with the original hash - should fail
    const repoWithExpectedHash = new CsvLotteryRepository(testFile, originalHash)

    await expect(repoWithExpectedHash.load()).rejects.toThrow('CSV integrity check failed')
  })

  it('integrity check fails with corrupted file and correct hash expectation', async () => {
    const content = createCsvContent(testRecords)
    const hash = computeHash(content)

    // Save pristine data
    writeFileSync(testFile, content, 'utf-8')

    // Verify integrity passes initially
    const repoWithHash = new CsvLotteryRepository(testFile, hash)
    await expect(repoWithHash.verifyIntegrity()).resolves.not.toThrow()

    // Corrupt the file
    appendFileSync(testFile, '\nfake,data,here,fake\n', 'utf-8')

    // Now integrity check should fail
    const repoStrictCheck = new CsvLotteryRepository(testFile, hash)
    await expect(repoStrictCheck.verifyIntegrity()).rejects.toThrow('CSV integrity check failed')
  })

  it('corruption is detected even with small appended data', async () => {
    const content = createCsvContent(testRecords)
    const trustedHash = computeHash(content)
    writeFileSync(testFile, content, 'utf-8')

    // Append just a newline character
    appendFileSync(testFile, '\n', 'utf-8')

    // Verify hash now differs
    const repoCheckHash = new CsvLotteryRepository(testFile)
    await repoCheckHash.load()
    const corruptedHash = repoCheckHash.getHash()

    expect(corruptedHash).not.toBe(trustedHash)
  })

  it('provides informative error message with both hashes', async () => {
    const content = createCsvContent(testRecords)
    const goodHash = computeHash(content)
    writeFileSync(testFile, content, 'utf-8')

    // Corrupt
    appendFileSync(testFile, 'corrupted data\n', 'utf-8')

    // Try to load with verification
    const strictRepo = new CsvLotteryRepository(testFile, goodHash)

    try {
      await strictRepo.load()
      expect.fail('Should have thrown integrity error')
    } catch (error: unknown) {
      const message = (error as Error).message
      expect(message).toContain('CSV integrity check failed')
      expect(message).toContain(goodHash) // Expected hash in message
      expect(message).toContain('got') // Indication of actual hash
    }
  })

  it('handles multiple sequential saves with updated hashes', async () => {
    // First save
    const content1 = createCsvContent(testRecords)
    const hash1 = computeHash(content1)
    writeFileSync(testFile, content1, 'utf-8')
    expect(hash1).toBeDefined()

    // Load and verify with hash1
    const repo1 = new CsvLotteryRepository(testFile, hash1)
    const loaded1 = await repo1.load()
    expect(loaded1.length).toBe(3)

    // Add more records and save again
    const moreRecords: LotteryRecord[] = [
      ...testRecords,
      {
        id: 'draw-004',
        drawDate: '2024-01-04',
        mainNumbers: [7, 14, 21, 28, 35],
      },
    ]

    const content2 = createCsvContent(moreRecords)
    const hash2 = computeHash(content2)
    writeFileSync(testFile, content2, 'utf-8')
    expect(hash2).not.toBe(hash1) // Hash should differ with more data

    // Load with new hash
    const repo2 = new CsvLotteryRepository(testFile, hash2)
    const loaded2 = await repo2.load()
    expect(loaded2.length).toBe(4)

    // Old hash should now fail
    const repoOld = new CsvLotteryRepository(testFile, hash1)
    await expect(repoOld.load()).rejects.toThrow()
  })

  it('demonstrates High-Integrity Warning scenario', async () => {
    // Scenario: trusted game data
    console.log('=== High-Integrity Warning Scenario ===')
    console.log('1. Loading trusted lottery data...')
    const content = createCsvContent(testRecords)
    const trustedHash = computeHash(content)
    writeFileSync(testFile, content, 'utf-8')
    console.log(`   Hash: ${trustedHash.substring(0, 16)}...`)

    console.log('2. Data corruption detected (tampering or corruption)...')
    appendFileSync(testFile, '\nUNAUTHORIZED_ENTRY,2024-12-31,"00,00,00,00,00",00\n', 'utf-8')

    console.log('3. Attempting to load with integrity check...')
    const secureRepo = new CsvLotteryRepository(testFile, trustedHash)

    let integrityViolation = false
    try {
      await secureRepo.load()
    } catch (error: unknown) {
      integrityViolation = true
      console.log(`   ⚠️  HIGH-INTEGRITY WARNING: ${(error as Error).message}`)
    }

    expect(integrityViolation).toBe(true)
    console.log('✓ Integrity protection working correctly')
  })
})
