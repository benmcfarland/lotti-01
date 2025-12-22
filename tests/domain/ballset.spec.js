"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BallSet_1 = require("../../src/domain/value-objects/BallSet");
const config = {
    mainPool: { minNumber: 1, maxNumber: 49, count: 6 },
    bonusPool: { minNumber: 1, maxNumber: 10, count: 1 },
};
(0, vitest_1.describe)('BallSet', () => {
    (0, vitest_1.it)('constructs for main pool with valid numbers', () => {
        const bs = new BallSet_1.BallSet([5, 3, 12, 1, 49, 20], config, 'main');
        (0, vitest_1.expect)(bs.toArray().length).toBe(6);
        (0, vitest_1.expect)(bs.contains(12)).toBe(true);
    });
    (0, vitest_1.it)('throws when count mismatches', () => {
        (0, vitest_1.expect)(() => new BallSet_1.BallSet([1, 2], config, 'main')).toThrow();
    });
    (0, vitest_1.it)('throws on out-of-range number', () => {
        (0, vitest_1.expect)(() => new BallSet_1.BallSet([1, 2, 3, 4, 5, 99], config, 'main')).toThrow();
    });
    (0, vitest_1.it)('throws on duplicates', () => {
        (0, vitest_1.expect)(() => new BallSet_1.BallSet([1, 2, 3, 4, 5, 5], config, 'main')).toThrow();
    });
    (0, vitest_1.it)('supports bonus pool when defined', () => {
        const bs = new BallSet_1.BallSet([7], config, 'bonus');
        (0, vitest_1.expect)(bs.toArray()).toEqual([7]);
    });
    (0, vitest_1.it)('throws when bonus pool not defined', () => {
        const cfg2 = { mainPool: config.mainPool };
        // @ts-expect-error runtime test: bonus not defined
        (0, vitest_1.expect)(() => new BallSet_1.BallSet([1], cfg2, 'bonus')).toThrow();
    });
    (0, vitest_1.it)('is immutable: toArray returns a copy', () => {
        const bs = new BallSet_1.BallSet([6, 5, 4, 3, 2, 1], config, 'main');
        const arr = bs.toArray();
        arr.push(999);
        (0, vitest_1.expect)(bs.contains(999)).toBe(false);
    });
});
//# sourceMappingURL=ballset.spec.js.map