"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvLotteryRepository = void 0;
const promises_1 = require("fs/promises");
const crypto_1 = require("crypto");
const sync_1 = require("csv-parse/sync");
/**
 * CSV repository implementation with SHA-256 integrity verification.
 *
 * Expected CSV format:
 * id,drawDate,mainNumbers,bonusNumber
 * draw-001,2023-01-15,"1,2,3,4,5,6",7
 * draw-002,2023-01-22,"8,9,10,11,12,13",14
 */
class CsvLotteryRepository {
    filePath;
    expectedHash;
    records = [];
    fileHash = '';
    /**
     * @param filePath Path to the CSV file
     * @param expectedHash Optional SHA-256 hash for integrity verification
     */
    constructor(filePath, expectedHash) {
        this.filePath = filePath;
        this.expectedHash = expectedHash;
    }
    /**
     * Compute SHA-256 hash of file contents.
     */
    async computeFileHash(contents) {
        return (0, crypto_1.createHash)('sha256').update(contents).digest('hex');
    }
    /**
     * Load and verify integrity of the CSV file.
     * Throws if hash validation fails (if expectedHash was provided).
     */
    async verifyIntegrity() {
        const contents = await (0, promises_1.readFile)(this.filePath);
        this.fileHash = await this.computeFileHash(contents);
        if (this.expectedHash && this.fileHash !== this.expectedHash) {
            throw new Error(`CSV integrity check failed. Expected hash ${this.expectedHash}, got ${this.fileHash}`);
        }
    }
    /**
     * Load lottery records from CSV.
     * Calls verifyIntegrity() first if expectedHash is set.
     */
    async load() {
        if (this.expectedHash) {
            await this.verifyIntegrity();
        }
        else {
            // Still compute hash for reference even if not validating
            const contents = await (0, promises_1.readFile)(this.filePath);
            this.fileHash = await this.computeFileHash(contents);
        }
        const contents = await (0, promises_1.readFile)(this.filePath, 'utf-8');
        const rows = (0, sync_1.parse)(contents, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        this.records = rows.map((row) => {
            const mainNumbers = row.mainNumbers
                .split(',')
                .map((n) => parseInt(n.trim(), 10))
                .filter((n) => !isNaN(n));
            return {
                id: row.id,
                drawDate: row.drawDate,
                mainNumbers,
                bonusNumber: row.bonusNumber ? parseInt(row.bonusNumber, 10) : undefined,
            };
        });
        return this.records;
    }
    /** Return the SHA-256 hash of the last loaded file. */
    getHash() {
        return this.fileHash;
    }
    /**
     * Save lottery records to CSV file.
     * Computes and returns the SHA-256 hash of the written content.
     */
    async save(records) {
        // Build CSV content
        const header = 'id,drawDate,mainNumbers,bonusNumber\n';
        const lines = records.map((r) => {
            const mainStr = r.mainNumbers.join(',');
            const bonusStr = r.bonusNumber ? r.bonusNumber.toString() : '';
            return `${r.id},${r.drawDate},"${mainStr}",${bonusStr}`;
        });
        const content = header + lines.join('\n');
        // Write to file
        await (0, promises_1.writeFile)(this.filePath, content, 'utf-8');
        // Compute and store hash
        const buffer = Buffer.from(content, 'utf-8');
        this.fileHash = await this.computeFileHash(buffer);
        return this.fileHash;
    }
}
exports.CsvLotteryRepository = CsvLotteryRepository;
//# sourceMappingURL=CsvLotteryRepository.js.map