/**
 * Pure domain interface for a seeded random provider.
 * Implementations must be deterministic given the same seed.
 */
export interface IRandomProvider {
    /** Seed the RNG with a string or number. Deterministic after seeding. */
    seed(seed: string | number): void;
    /**
     * Return a non-negative 32-bit integer. If `bound` is provided, return
     * a value in [0, bound) (bound must be a positive integer).
     */
    nextInt(bound?: number): number;
}
//# sourceMappingURL=IRandomProvider.d.ts.map