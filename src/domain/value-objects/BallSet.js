"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BallSet = void 0;
function validatePoolConfig(pc) {
    if (!Number.isInteger(pc.minNumber) || !Number.isInteger(pc.maxNumber)) {
        throw new Error('PoolConfig minNumber/maxNumber must be integers');
    }
    if (pc.minNumber < 0 || pc.maxNumber <= pc.minNumber) {
        throw new Error('PoolConfig range is invalid');
    }
    if (!Number.isInteger(pc.count) || pc.count <= 0) {
        throw new Error('PoolConfig count must be a positive integer');
    }
}
/**
 * Immutable value object representing an unordered set of ball numbers for a pool.
 * Validates count and range according to a provided `GameConfig` and pool type.
 */
class BallSet {
    numbers;
    poolKey;
    constructor(numbers, config, pool = 'main') {
        if (!Array.isArray(numbers))
            throw new Error('numbers must be an array');
        const poolConfig = pool === 'main' ? config.mainPool : config.bonusPool;
        if (!poolConfig)
            throw new Error(`${pool} pool is not defined in GameConfig`);
        validatePoolConfig(poolConfig);
        // Create a copy and validate
        const copy = numbers.slice();
        if (copy.length !== poolConfig.count) {
            throw new Error(`expected ${poolConfig.count} numbers for ${pool} pool`);
        }
        // Ensure integers, uniqueness and range
        const seen = new Set();
        for (const n of copy) {
            if (!Number.isInteger(n))
                throw new Error('ball numbers must be integers');
            if (n < poolConfig.minNumber || n > poolConfig.maxNumber) {
                throw new Error(`ball ${n} out of range [${poolConfig.minNumber},${poolConfig.maxNumber}]`);
            }
            if (seen.has(n))
                throw new Error('duplicate ball numbers are not allowed');
            seen.add(n);
        }
        // sort internally to normalize equality, but maintain immutability by copying
        this.numbers = Array.from(seen).sort((a, b) => a - b);
        this.poolKey = pool;
        Object.freeze(this.numbers);
        Object.freeze(this);
    }
    toArray() {
        return this.numbers.slice();
    }
    contains(n) {
        return this.numbers.indexOf(n) !== -1;
    }
    equals(other) {
        if (this === other)
            return true;
        if (this.poolKey !== other.poolKey)
            return false;
        const a = this.numbers;
        const b = other.numbers;
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++)
            if (a[i] !== b[i])
                return false;
        return true;
    }
}
exports.BallSet = BallSet;
//# sourceMappingURL=BallSet.js.map