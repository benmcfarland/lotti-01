/**
 * CLI Integration Example for SimulateStrategy
 *
 * Add this to src/cli/index.ts to enable:
 *   lotti simulate <strategy> <gameId> [target-numbers]
 *
 * Example:
 *   npx ts-node src/cli/index.ts simulate balancer test-game "10,20,30,40,50"
 */

// ============================================================================
// Add to program definition in src/cli/index.ts:
// ============================================================================

/*
program
  .command('simulate <strategy> <gameId> <targetNumbers>')
  .description('Simulate strategy vs random picking (10,000 iterations each)')
  .option(
    '-c, --config <config>',
    'Game configuration (pick5, powerball, etc)',
    'pick5',
  )
  .option(
    '-b, --bonus <number>',
    'Optional bonus number to match',
  )
  .option(
    '-i, --iterations <number>',
    'Iterations per track (default: 10000)',
    '10000',
  )
  .action(async (strategyName: string, gameId: string, targetStr: string, options: any) => {
    try {
      // Parse target numbers
      const targetNumbers = targetStr.split(',').map((s: string) => parseInt(s.trim(), 10))
      const bonusNumber = options.bonus ? parseInt(options.bonus, 10) : undefined
      const iterations = parseInt(options.iterations, 10)

      // Define strategies
      const strategies: { [key: string]: IPickingStrategy } = {
        balancer: new TheBalancerStrategy(rng),
        random: new RandomPickingStrategy(rng),
      }

      const strategy = strategies[strategyName.toLowerCase()]
      if (!strategy) {
        console.error(`Unknown strategy: ${strategyName}`)
        console.error(`Available: ${Object.keys(strategies).join(', ')}`)
        process.exit(1)
      }

      // Define game configs
      const gameConfigs: { [key: string]: GameConfig } = {
        pick5: { mainPool: { minNumber: 1, maxNumber: 50, count: 5 } },
        powerball: {
          mainPool: { minNumber: 1, maxNumber: 69, count: 5 },
          bonusPool: { minNumber: 1, maxNumber: 26, count: 1 },
        },
        megamillions: {
          mainPool: { minNumber: 1, maxNumber: 70, count: 5 },
          bonusPool: { minNumber: 1, maxNumber: 25, count: 1 },
        },
      }

      const gameConfig = gameConfigs[options.config]
      if (!gameConfig) {
        console.error(`Unknown config: ${options.config}`)
        process.exit(1)
      }

      // Run simulation
      console.log(
        `\n${colors.cyan}Running dual-track simulation...${colors.reset}`,
      )
      console.log(
        `  Strategy: ${colors.bold}${strategyName}${colors.reset}`,
      )
      console.log(
        `  Target: [${targetNumbers.join(', ')}]${bonusNumber ? ` + ${bonusNumber}` : ''}`,
      )
      console.log(`  Iterations: ${iterations} per track\n`)

      const simulator = new SimulateStrategy(strategy, rng, gameConfig)
      const report = await simulator.execute(gameId, targetNumbers, bonusNumber, iterations)

      // Print results
      const summaryTable = new CliTable3({
        head: [
          colors.bold + 'Metric' + colors.reset,
          colors.bold + 'Strategy Track' + colors.reset,
          colors.bold + 'Random Track' + colors.reset,
        ],
        colWidths: [25, 20, 20],
      })

      summaryTable.push(
        [
          'Matches',
          report.strategyTrack.matchesCount.toString(),
          report.randomTrack.matchesCount.toString(),
        ],
        [
          'Match Rate',
          (report.strategyTrack.matchRate * 100).toFixed(4) + '%',
          (report.randomTrack.matchRate * 100).toFixed(4) + '%',
        ],
        [
          'Expected Matches',
          report.strategyTrack.expectedMatches.toFixed(1),
          report.randomTrack.expectedMatches.toFixed(1),
        ],
        [
          'ROI',
          report.strategyTrack.roi.toFixed(2) + '%',
          report.randomTrack.roi.toFixed(2) + '%',
        ],
      )

      console.log(colors.bold + 'Simulation Results:' + colors.reset)
      console.log(summaryTable.toString())

      // Print divergence
      console.log(colors.bold + '\nDivergence Analysis:' + colors.reset)
      const divColor =
        Math.abs(report.divergence) < 5 ? colors.green : colors.yellow
      console.log(
        `  Divergence: ${divColor}${report.divergence.toFixed(2)}%${colors.reset}`,
      )
      console.log(`  (Strategy ROI - Random ROI)`)

      // Print conclusion
      console.log(colors.bold + '\nConclusion:' + colors.reset)
      console.log(`  ${report.conclusion}`)

      console.log()
      process.exit(0)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`\n${colors.red}❌ Error: ${message}${colors.reset}\n`)
      process.exit(1)
    }
  })
*/

// ============================================================================
// Usage Examples:
// ============================================================================

/*

# Test BalancerStrategy vs Random for Pick 5
npx ts-node src/cli/index.ts simulate balancer my-game "10,20,30,40,50"

# Same with Powerball and bonus
npx ts-node src/cli/index.ts simulate balancer powerball-game "5,15,25,35,45" --config powerball --bonus 14

# Test with custom iteration count
npx ts-node src/cli/index.ts simulate balancer test "1,2,3,4,5" --iterations 50000

# Expected output:
# =========================================================================
# Simulation Results:
# ┌─────────────────────────┬──────────────────┬─────────────────┐
# │ Metric                  │ Strategy Track   │ Random Track    │
# ├─────────────────────────┼──────────────────┼─────────────────┤
# │ Matches                 │ 1                │ 0               │
# │ Match Rate              │ 0.0001%          │ 0.0000%         │
# │ Expected Matches        │ 0.5              │ 0.5             │
# │ ROI                     │ 100.00%          │ -100.00%        │
# └─────────────────────────┴──────────────────┴─────────────────┘
#
# Divergence Analysis:
#   Divergence: 200.00%
#   (Strategy ROI - Random ROI)
#
# Conclusion:
#   Strategy outperforms random selection by 200.00% ROI.
#   However, verify this exceeds normal statistical variation (5% threshold).

*/
