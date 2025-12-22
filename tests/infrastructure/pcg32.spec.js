"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PCG32RandomProvider_1 = require("../../src/infrastructure/PCG32RandomProvider");
(0, vitest_1.describe)('PCG32RandomProvider deterministic behavior', () => {
    (0, vitest_1.it)('produces identical sequences after seeding with same seed', () => {
        const seed = 'deterministic-seed-123';
        const a = new PCG32RandomProvider_1.PCG32RandomProvider();
        const b = new PCG32RandomProvider_1.PCG32RandomProvider();
        a.seed(seed);
        b.seed(seed);
        const seqA = [];
        const seqB = [];
        for (let i = 0; i < 20; i++) {
            seqA.push(a.nextInt(1_000_000));
            seqB.push(b.nextInt(1_000_000));
        }
        (0, vitest_1.expect)(seqA).toEqual(seqB);
    });
    (0, vitest_1.it)('produces different sequences for different seeds', () => {
        const a = new PCG32RandomProvider_1.PCG32RandomProvider();
        const b = new PCG32RandomProvider_1.PCG32RandomProvider();
        a.seed('seed-a');
        b.seed('seed-b');
        const sa = [];
        const sb = [];
        for (let i = 0; i < 10; i++) {
            sa.push(a.nextInt(10000));
            sb.push(b.nextInt(10000));
        }
        // It's extremely unlikely these short sequences match exactly between two different seeds
        (0, vitest_1.expect)(sa).not.toEqual(sb);
    });
});
//# sourceMappingURL=pcg32.spec.js.map