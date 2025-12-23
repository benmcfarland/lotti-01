'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const vitest_1 = require('vitest')
const fs_1 = require('fs')
const crypto_1 = require('crypto')
const CsvLotteryRepository_1 = require('../../src/infrastructure/CsvLotteryRepository')
/**
 * Helper function to create CSV content from records
 */
function createCsvContent(records) {
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
function computeHash(content) {
  return (0, crypto_1.createHash)('sha256').update(content, 'utf-8').digest('hex')
}
;(0, vitest_1.describe)('CSV Repository Integrity Integration Test', () => {
  const testDir = '/tmp/lotti-integrity-test'
  const testFile = `${testDir}/lottery_integrity.csv`
  const testRecords = [
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
  ;(0, vitest_1.beforeAll)(() => {
    // Create test directory
    if (!(0, fs_1.existsSync)(testDir)) {
      ;(0, fs_1.mkdirSync)(testDir, { recursive: true })
    }
  })
  ;(0, vitest_1.afterAll)(() => {
    // Cleanup test files
    try {
      if ((0, fs_1.existsSync)(testFile)) {
        ;(0, fs_1.unlinkSync)(testFile)
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  })
  ;(0, vitest_1.it)('saves and verifies lottery records with SHA-256 hash', async () => {
    const content = createCsvContent(testRecords)
    const hash = computeHash(content)
    // Write the CSV file
    ;(0, fs_1.writeFileSync)(testFile, content, 'utf-8')
    ;(0, vitest_1.expect)(hash).toBeDefined()
    ;(0, vitest_1.expect)(hash.length).toBe(64) // SHA-256 hex = 64 chars
    ;(0, vitest_1.expect)((0, fs_1.existsSync)(testFile)).toBe(true)
    // Verify we can load it back
    const repo = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, hash)
    await (0, vitest_1.expect)(repo.load()).resolves.not.toThrow()
  })
  ;(0, vitest_1.it)('loads saved records successfully', async () => {
    const content = createCsvContent(testRecords)
    ;(0, fs_1.writeFileSync)(testFile, content, 'utf-8')
    const repo = new CsvLotteryRepository_1.CsvLotteryRepository(testFile)
    const loaded = await repo.load()
    ;(0, vitest_1.expect)(loaded.length).toBe(3)
    ;(0, vitest_1.expect)(loaded[0]?.id).toBe('draw-001')
    ;(0, vitest_1.expect)(loaded[0]?.mainNumbers).toEqual([1, 2, 3, 4, 5])
  })
  ;(0, vitest_1.it)('detects file corruption via SHA-256 mismatch', async () => {
    const content = createCsvContent(testRecords)
    const originalHash = computeHash(content)
    // Write with valid hash
    ;(0, fs_1.writeFileSync)(testFile, content, 'utf-8')
    // Corrupt the file by appending fake data (bypassing repository)
    const corruptedLine = 'draw-999,2024-12-31,"99,99,99,99,99",99\n'
    ;(0, fs_1.appendFileSync)(testFile, corruptedLine, 'utf-8')
    // Now try to load with the original hash - should fail
    const repoWithExpectedHash = new CsvLotteryRepository_1.CsvLotteryRepository(
      testFile,
      originalHash
    )
    await (0, vitest_1.expect)(repoWithExpectedHash.load()).rejects.toThrow(
      'CSV integrity check failed'
    )
  })
  ;(0, vitest_1.it)(
    'integrity check fails with corrupted file and correct hash expectation',
    async () => {
      const content = createCsvContent(testRecords)
      const hash = computeHash(content)
      // Save pristine data
      ;(0, fs_1.writeFileSync)(testFile, content, 'utf-8')
      // Verify integrity passes initially
      const repoWithHash = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, hash)
      await (0, vitest_1.expect)(repoWithHash.verifyIntegrity()).resolves.not.toThrow()
      // Corrupt the file
      ;(0, fs_1.appendFileSync)(testFile, '\nfake,data,here,fake\n', 'utf-8')
      // Now integrity check should fail
      const repoStrictCheck = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, hash)
      await (0, vitest_1.expect)(repoStrictCheck.verifyIntegrity()).rejects.toThrow(
        'CSV integrity check failed'
      )
    }
  )
  ;(0, vitest_1.it)('corruption is detected even with small appended data', async () => {
    const content = createCsvContent(testRecords)
    const trustedHash = computeHash(content)
    ;(0, fs_1.writeFileSync)(testFile, content, 'utf-8')
    // Append just a newline character
    ;(0, fs_1.appendFileSync)(testFile, '\n', 'utf-8')
    // Verify hash now differs
    const repoCheckHash = new CsvLotteryRepository_1.CsvLotteryRepository(testFile)
    await repoCheckHash.load()
    const corruptedHash = repoCheckHash.getHash()
    ;(0, vitest_1.expect)(corruptedHash).not.toBe(trustedHash)
  })
  ;(0, vitest_1.it)('provides informative error message with both hashes', async () => {
    const content = createCsvContent(testRecords)
    const goodHash = computeHash(content)
    ;(0, fs_1.writeFileSync)(testFile, content, 'utf-8')
    // Corrupt
    ;(0, fs_1.appendFileSync)(testFile, 'corrupted data\n', 'utf-8')
    // Try to load with verification
    const strictRepo = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, goodHash)
    try {
      await strictRepo.load()
      vitest_1.expect.fail('Should have thrown integrity error')
    } catch (error) {
      const message = error.message
      ;(0, vitest_1.expect)(message).toContain('CSV integrity check failed')
      ;(0, vitest_1.expect)(message).toContain(goodHash) // Expected hash in message
      ;(0, vitest_1.expect)(message).toContain('got') // Indication of actual hash
    }
  })
  ;(0, vitest_1.it)('handles multiple sequential saves with updated hashes', async () => {
    // First save
    const content1 = createCsvContent(testRecords)
    const hash1 = computeHash(content1)
    ;(0, fs_1.writeFileSync)(testFile, content1, 'utf-8')
    ;(0, vitest_1.expect)(hash1).toBeDefined()
    // Load and verify with hash1
    const repo1 = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, hash1)
    const loaded1 = await repo1.load()
    ;(0, vitest_1.expect)(loaded1.length).toBe(3)
    // Add more records and save again
    const moreRecords = [
      ...testRecords,
      {
        id: 'draw-004',
        drawDate: '2024-01-04',
        mainNumbers: [7, 14, 21, 28, 35],
      },
    ]
    const content2 = createCsvContent(moreRecords)
    const hash2 = computeHash(content2)
    ;(0, fs_1.writeFileSync)(testFile, content2, 'utf-8')
    ;(0, vitest_1.expect)(hash2).not.toBe(hash1) // Hash should differ with more data
    // Load with new hash
    const repo2 = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, hash2)
    const loaded2 = await repo2.load()
    ;(0, vitest_1.expect)(loaded2.length).toBe(4)
    // Old hash should now fail
    const repoOld = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, hash1)
    await (0, vitest_1.expect)(repoOld.load()).rejects.toThrow()
  })
  ;(0, vitest_1.it)('demonstrates High-Integrity Warning scenario', async () => {
    // Scenario: trusted game data
    console.log('=== High-Integrity Warning Scenario ===')
    console.log('1. Loading trusted lottery data...')
    const content = createCsvContent(testRecords)
    const trustedHash = computeHash(content)
    ;(0, fs_1.writeFileSync)(testFile, content, 'utf-8')
    console.log(`   Hash: ${trustedHash.substring(0, 16)}...`)
    console.log('2. Data corruption detected (tampering or corruption)...')
    ;(0, fs_1.appendFileSync)(
      testFile,
      '\nUNAUTHORIZED_ENTRY,2024-12-31,"00,00,00,00,00",00\n',
      'utf-8'
    )
    console.log('3. Attempting to load with integrity check...')
    const secureRepo = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, trustedHash)
    let integrityViolation = false
    try {
      await secureRepo.load()
    } catch (error) {
      integrityViolation = true
      console.log(`   ⚠️  HIGH-INTEGRITY WARNING: ${error.message}`)
    }
    ;(0, vitest_1.expect)(integrityViolation).toBe(true)
    console.log('✓ Integrity protection working correctly')
  })
})
//# sourceMappingURL=Integrity.spec.js.map
