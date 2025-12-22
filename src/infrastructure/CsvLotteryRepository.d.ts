import type { ILotteryRepository, LotteryRecord } from '../domain/ILotteryRepository';
/**
 * CSV repository implementation with SHA-256 integrity verification.
 *
 * Expected CSV format:
 * id,drawDate,mainNumbers,bonusNumber
 * draw-001,2023-01-15,"1,2,3,4,5,6",7
 * draw-002,2023-01-22,"8,9,10,11,12,13",14
 */
export declare class CsvLotteryRepository implements ILotteryRepository {
    private readonly filePath;
    private readonly expectedHash?;
    private records;
    private fileHash;
    /**
     * @param filePath Path to the CSV file
     * @param expectedHash Optional SHA-256 hash for integrity verification
     */
    constructor(filePath: string, expectedHash?: string);
    /**
     * Compute SHA-256 hash of file contents.
     */
    private computeFileHash;
    /**
     * Load and verify integrity of the CSV file.
     * Throws if hash validation fails (if expectedHash was provided).
     */
    verifyIntegrity(): Promise<void>;
    /**
     * Load lottery records from CSV.
     * Calls verifyIntegrity() first if expectedHash is set.
     */
    load(): Promise<LotteryRecord[]>;
    /** Return the SHA-256 hash of the last loaded file. */
    getHash(): string;
    /**
     * Save lottery records to CSV file.
     * Computes and returns the SHA-256 hash of the written content.
     */
    save(records: LotteryRecord[]): Promise<string>;
}
//# sourceMappingURL=CsvLotteryRepository.d.ts.map