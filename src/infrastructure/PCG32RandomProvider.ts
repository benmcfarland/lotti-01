import type { IRandomProvider } from '../domain/IRandomProvider'

/**
 * PCG32RandomProvider - a deterministic seeded provider backed by `seedrandom`.
 *
 * Note: for determinism across environments we explicitly select the
 * `alea` algorithm from `seedrandom` and produce 32-bit unsigned ints.
 */
export class PCG32RandomProvider implements IRandomProvider {
  private rng: () => number

  constructor() {
    this.rng = () => Math.random()
  }

  seed(seed: string | number): void {
    // Use require to avoid TS module interop issues in this commonjs setup
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const seedrandom = require('seedrandom')
    // choose 'alea' algorithm for stable cross-environment outputs
    this.rng = seedrandom(String(seed), { algorithm: 'alea' })
  }

  nextInt(bound?: number): number {
    // produce a 32-bit unsigned integer from rng()
    const u32 = Math.floor(this.rng() * 0x100000000)
    if (bound === undefined) return u32
    if (!Number.isInteger(bound) || bound <= 0) throw new Error('bound must be a positive integer')
    return u32 % bound
  }
}
