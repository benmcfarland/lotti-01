import { describe, it, expect } from 'vitest'
import { BallSet } from '../../src/domain/value-objects/BallSet'
import type { GameConfig } from '../../src/domain/interfaces/GameConfig'

const config: GameConfig = {
  mainPool: { minNumber: 1, maxNumber: 49, count: 6 },
  bonusPool: { minNumber: 1, maxNumber: 10, count: 1 },
}

describe('BallSet', () => {
  it('constructs for main pool with valid numbers', () => {
    const bs = new BallSet([5, 3, 12, 1, 49, 20], config, 'main')
    expect(bs.toArray().length).toBe(6)
    expect(bs.contains(12)).toBe(true)
  })

  it('throws when count mismatches', () => {
    expect(() => new BallSet([1, 2], config, 'main')).toThrow()
  })

  it('throws on out-of-range number', () => {
    expect(() => new BallSet([1, 2, 3, 4, 5, 99], config, 'main')).toThrow()
  })

  it('throws on duplicates', () => {
    expect(() => new BallSet([1, 2, 3, 4, 5, 5], config, 'main')).toThrow()
  })

  it('supports bonus pool when defined', () => {
    const bs = new BallSet([7], config, 'bonus')
    expect(bs.toArray()).toEqual([7])
  })

  it('throws when bonus pool not defined', () => {
    const cfg2: GameConfig = { mainPool: config.mainPool }
    // @ts-expect-error runtime test: bonus not defined
    expect(() => new BallSet([1], cfg2, 'bonus')).toThrow()
  })

  it('is immutable: toArray returns a copy', () => {
    const bs = new BallSet([6, 5, 4, 3, 2, 1], config, 'main')
    const arr = bs.toArray()
    arr.push(999)
    expect(bs.contains(999)).toBe(false)
  })
})
