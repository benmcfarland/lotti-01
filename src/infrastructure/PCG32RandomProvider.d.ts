import type { IRandomProvider } from '../domain/IRandomProvider';
/**
 * PCG32RandomProvider - a deterministic seeded provider backed by `seedrandom`.
 *
 * Note: for determinism across environments we explicitly select the
 * `alea` algorithm from `seedrandom` and produce 32-bit unsigned ints.
 */
export declare class PCG32RandomProvider implements IRandomProvider {
    private rng;
    constructor();
    seed(seed: string | number): void;
    nextInt(bound?: number): number;
}
//# sourceMappingURL=PCG32RandomProvider.d.ts.map