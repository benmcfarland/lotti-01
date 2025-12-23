"use strict";
/**
 * Example: Running a Dual-Track Simulation with SimulateStrategy
 *
 * This demonstrates how to use the SimulateStrategy application service
 * to prove that a picking strategy performs identically to random selection
 * over large samples.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const SimulateStrategy_1 = require("../src/application/SimulateStrategy");
const TheBalancerStrategy_1 = require("../src/infrastructure/TheBalancerStrategy");
const PCG32RandomProvider_1 = require("../src/infrastructure/PCG32RandomProvider");
async function runSimulation() {
    // 1. Initialize RNG and game config
    const rng = new PCG32RandomProvider_1.PCG32RandomProvider();
    rng.seed('simulation-seed-123');
    const gameConfig = {
        mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
    };
    // 2. Create a picking strategy (we'll test TheBalancerStrategy)
    const strategy = new TheBalancerStrategy_1.TheBalancerStrategy(rng);
    // 3. Initialize the simulation service
    const simulator = new SimulateStrategy_1.SimulateStrategy(strategy, rng, gameConfig);
    // 4. Define the winning numbers we're testing against
    const targetNumbers = [10, 20, 30, 40, 50];
    // 5. Run the dual-track simulation
    // This will run 10,000 iterations of:
    // - TheBalancerStrategy (the strategy we're testing)
    // - RandomPickingStrategy (pure random baseline)
    // Both trying to match the target numbers
    const report = await simulator.execute('simulation-001', targetNumbers, undefined, // No bonus pool for this example
    10000);
    // 6. Analyze the results
    console.log('='.repeat(80));
    console.log('SIMULATION RESULTS: Strategy vs Random Picking');
    console.log('='.repeat(80));
    console.log();
    console.log('Configuration:');
    console.log(`  Game ID: ${report.gameId}`);
    console.log(`  Iterations per track: ${report.iterations}`);
    console.log(`  Target numbers: [${report.targetNumbers.join(', ')}]`);
    console.log();
    console.log('Strategy Track:');
    console.log(`  Matches: ${report.strategyTrack.matchesCount}`);
    console.log(`  Match rate: ${(report.strategyTrack.matchRate * 100).toFixed(4)}%`);
    console.log(`  Expected matches: ${report.strategyTrack.expectedMatches}`);
    console.log(`  ROI: ${report.strategyTrack.roi.toFixed(2)}%`);
    console.log();
    console.log('Random Track (Baseline):');
    console.log(`  Matches: ${report.randomTrack.matchesCount}`);
    console.log(`  Match rate: ${(report.randomTrack.matchRate * 100).toFixed(4)}%`);
    console.log(`  Expected matches: ${report.randomTrack.expectedMatches}`);
    console.log(`  ROI: ${report.randomTrack.roi.toFixed(2)}%`);
    console.log();
    console.log('Divergence Analysis:');
    console.log(`  Divergence: ${report.divergence.toFixed(2)}%`);
    console.log(`  (Strategy ROI - Random ROI)`);
    console.log();
    console.log('Conclusion:');
    console.log(`  ${report.conclusion}`);
    console.log();
    console.log('='.repeat(80));
    // 7. Interpret the results
    console.log();
    console.log('INTERPRETATION:');
    console.log();
    if (Math.abs(report.divergence) < 5) {
        console.log('✓ The strategy performs identically to random selection.');
        console.log('  This proves the strategy provides no statistical advantage.');
        console.log('  Both tracks achieved similar ROI over 10,000 iterations.');
    }
    else if (report.divergence > 5) {
        console.log('⚠ The strategy shows some outperformance vs random.');
        console.log('  However, verify this exceeds normal statistical variation.');
        console.log('  Additional testing with different targets is recommended.');
    }
    else {
        console.log('✗ Random selection outperforms the strategy.');
        console.log('  The strategy is less effective than pure random picking.');
    }
    console.log();
}
// Run the simulation
runSimulation().catch((error) => {
    console.error('Simulation error:', error);
    process.exit(1);
});
//# sourceMappingURL=simulateStrategy.js.map