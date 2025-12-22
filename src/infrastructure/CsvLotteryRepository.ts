import { createReadStream } from 'fs'
import { readFile } from 'fs/promises'
import { createHash } from 'crypto'
import { parse } from 'csv-parse/sync'
import type { ILotteryRepository, LotteryRecord } from '../domain/ILotteryRepository'

/**
 * CSV repository implementation with SHA-256 integrity verification.
 * 
 * Expected CSV format:
 * id,drawDate,mainNumbers,bonusNumber
 * draw-001,2023-01-15,"1,2,3,4,5,6",7
 * draw-002,2023-01-22,"8,9,10,11,12,13",14
 */
export class CsvLotteryRepository implements ILotteryRepository {
  private readonly filePath: string
  private readonly expectedHash?: string
  private records: LotteryRecord[] = []
  private fileHash: string = ''

  /**
   * @param filePath Path to the CSV file
   * @param expectedHash Optional SHA-256 hash for integrity verification
   */
  constructor(filePath: string, expectedHash?: string) {
    this.filePath = filePath
    this.expectedHash = expectedHash
  }

  /**
   * Compute SHA-256 hash of file contents.
   */
  private async computeFileHash(contents: Buffer): Promise<string> {
    return createHash('sha256').update(contents).digest('hex')
  }

  /**
   * Load and verify integrity of the CSV file.
   * Throws if hash validation fails (if expectedHash was provided).
   */
  async verifyIntegrity(): Promise<void> {
    const contents = await readFile(this.filePath)
    this.fileHash = await this.computeFileHash(contents)

    if (this.expectedHash && this.fileHash !== this.expectedHash) {
      throw new Error(
        `CSV integrity check failed. Expected hash ${this.expectedHash}, got ${this.fileHash}`
      )
    }
  }

  /**
   * Load lottery records from CSV.
   * Calls verifyIntegrity() first if expectedHash is set.
   */
  async load(): Promise<LotteryRecord[]> {
    if (this.expectedHash) {
      await this.verifyIntegrity()
    } else {
      // Still compute hash for reference even if not validating
      const contents = await readFile(this.filePath)
      this.fileHash = await this.computeFileHash(contents)
    }

    const contents = await readFile(this.filePath, 'utf-8')
    const rows = parse(contents, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<{
      id: string
      drawDate: string
      mainNumbers: string
      bonusNumber?: string
    }>

    this.records = rows.map((row) => {
      const mainNumbers = row.mainNumbers
        .split(',')
        .map((n) => parseInt(n.trim(), 10))
        .filter((n) => !isNaN(n))

      return {
        id: row.id,
        drawDate: row.drawDate,
        mainNumbers,
        bonusNumber: row.bonusNumber ? parseInt(row.bonusNumber, 10) : undefined,
      }
    })

    return this.records
  }

  /** Return the SHA-256 hash of the last loaded file. */
  getHash(): string {
    return this.fileHash
  }
}
