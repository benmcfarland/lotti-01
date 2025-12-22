"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const CsvLotteryRepository_1 = require("../../src/infrastructure/CsvLotteryRepository");
(0, vitest_1.describe)('CsvLotteryRepository with SHA-256 integrity', () => {
    const testDir = '/tmp/lotti-test';
    const testFile = `${testDir}/lottery.csv`;
    const csvContent = `id,drawDate,mainNumbers,bonusNumber
draw-001,2023-01-15,"1,2,3,4,5,6",7
draw-002,2023-01-22,"8,9,10,11,12,13",14
draw-003,2023-02-05,"15,16,17,18,19,20",21`;
    let csvHash;
    (0, vitest_1.beforeAll)(() => {
        // Create test directory and file
        try {
            const fs = require('fs');
            if (!fs.existsSync(testDir))
                fs.mkdirSync(testDir, { recursive: true });
        }
        catch (e) {
            // dir may exist
        }
        (0, fs_1.writeFileSync)(testFile, csvContent, 'utf-8');
        csvHash = (0, crypto_1.createHash)('sha256').update(csvContent).digest('hex');
    });
    (0, vitest_1.afterAll)(() => {
        try {
            (0, fs_1.unlinkSync)(testFile);
        }
        catch (e) {
            // file may be gone
        }
    });
    (0, vitest_1.it)('loads CSV records successfully', async () => {
        const repo = new CsvLotteryRepository_1.CsvLotteryRepository(testFile);
        const records = await repo.load();
        (0, vitest_1.expect)(records.length).toBe(3);
        (0, vitest_1.expect)(records[0].id).toBe('draw-001');
        (0, vitest_1.expect)(records[0].drawDate).toBe('2023-01-15');
        (0, vitest_1.expect)(records[0].mainNumbers.length).toBe(6);
    });
    (0, vitest_1.it)('computes file hash on load', async () => {
        const repo = new CsvLotteryRepository_1.CsvLotteryRepository(testFile);
        await repo.load();
        const hash = repo.getHash();
        (0, vitest_1.expect)(hash).toBe(csvHash);
    });
    (0, vitest_1.it)('verifies integrity with matching hash', async () => {
        const repo = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, csvHash);
        // Should not throw
        await (0, vitest_1.expect)(repo.load()).resolves.toBeDefined();
    });
    (0, vitest_1.it)('throws on hash mismatch', async () => {
        const wrongHash = 'deadbeef0000000000000000000000000000000000000000000000000000beef';
        const repo = new CsvLotteryRepository_1.CsvLotteryRepository(testFile, wrongHash);
        await (0, vitest_1.expect)(repo.load()).rejects.toThrow('CSV integrity check failed');
    });
    (0, vitest_1.it)('parses bonus numbers when present', async () => {
        const repo = new CsvLotteryRepository_1.CsvLotteryRepository(testFile);
        const records = await repo.load();
        (0, vitest_1.expect)(records[0].bonusNumber).toBe(7);
        (0, vitest_1.expect)(records[1].bonusNumber).toBe(14);
    });
});
//# sourceMappingURL=csvRepository.spec.js.map