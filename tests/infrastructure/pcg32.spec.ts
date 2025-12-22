import { describe, it, expect } from 'vitest'
import { PCG32RandomProvider } from '../../src/infrastructure/PCG32RandomProvider'

describe('PCG32RandomProvider deterministic behavior', () => {
  it('produces identical sequences after seeding with same seed', () => {
    const seed = 'deterministic-seed-123'
    const a = new PCG32RandomProvider()
    const b = new PCG32RandomProvider()
    a.seed(seed)
    b.seed(seed)

    const seqA: number[] = []
    const seqB: number[] = []
    for (let i = 0; i < 20; i++) {
      seqA.push(a.nextInt(1_000_000))
      seqB.push(b.nextInt(1_000_000))
    }

    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    const a = new PCG32RandomProvider()
    const b = new PCG32RandomProvider()
    a.seed('seed-a')
    b.seed('seed-b')

    const sa: number[] = []
    const sb: number[] = []
    for (let i = 0; i < 10; i++) {
      sa.push(a.nextInt(10000))
      sb.push(b.nextInt(10000))
    }

    // It's extremely unlikely these short sequences match exactly between two different seeds
    expect(sa).not.toEqual(sb)
  })
})
