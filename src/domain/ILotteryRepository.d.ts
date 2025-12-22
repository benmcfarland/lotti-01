/**
 * Domain repository interface for lottery data persistence.
 * No external dependencies—implementations live in infrastructure.
 */
export interface LotteryRecord {
    readonly id: string;
    readonly drawDate: string;
    readonly mainNumbers: number[];
    readonly bonusNumber?: number;
}
export interface ILotteryRepository {
    /** Load lottery records from persistent storage. */
    load(): Promise<LotteryRecord[]>;
    /** Verify integrity (e.g., file hash) and throw if invalid. */
    verifyIntegrity(): Promise<void>;
    /** Save lottery records to persistent storage. Returns the SHA-256 hash. */
    save(records: LotteryRecord[]): Promise<string>;
}
//# sourceMappingURL=ILotteryRepository.d.ts.map