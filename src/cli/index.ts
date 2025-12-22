#!/usr/bin/env node

import { program } from 'commander'
import CliTable3 from 'cli-table3'
import { AnalyzeGame } from '../application/AnalyzeGame'
import { CsvLotteryRepository } from '../infrastructure/CsvLotteryRepository'
import type { GameConfig } from '../domain/interfaces/GameConfig'

/**
 * Color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

/**
 * Get status color code based on test result status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'PASS':
      return colors.green
    case 'WARN':
      return colors.yellow
    case 'FAIL':
      return colors.red
    default:
      return colors.reset
  }
}

/**
 * Format a number to fixed decimal places
 */
function formatNumber(num: number, decimals: number = 4): string {
  return num.toFixed(decimals)
}

/**
 * Print analysis results as formatted tables
 */
function printResults(report: any): void {
  console.log('\n' + colors.bold + '=' + '='.repeat(78) + colors.reset)
  console.log(colors.bold + colors.cyan + 'LOTTI STATISTICAL ANALYSIS REPORT' + colors.reset)
  console.log(colors.bold + '=' + '='.repeat(78) + colors.reset + '\n')

  // Header information
  const headerTable = new CliTable3({
    colWidths: [20, 60],
    wordWrap: true,
  })

  headerTable.push(
    ['Game ID', report.gameId],
    ['Analysis Time', report.timestamp],
    ['Number of Draws', report.drawCount.toString()],
    [
      'Overall Status',
      getStatusColor(report.overallStatus) + colors.bold + report.overallStatus + colors.reset,
    ],
  )

  console.log(headerTable.toString())
  console.log(colors.bold + '\nOverall Interpretation:' + colors.reset)
  console.log(`  ${report.overallInterpretation}`)
  console.log(colors.bold + '\nSummary:' + colors.reset)
  console.log(`  ${report.summary}\n`)

  // Test results table
  const testTable = new CliTable3({
    head: [
      colors.bold + 'Test Name' + colors.reset,
      colors.bold + 'Status' + colors.reset,
      colors.bold + 'Statistic' + colors.reset,
      colors.bold + 'P-Value' + colors.reset,
      colors.bold + 'Interpretation' + colors.reset,
    ],
    colWidths: [28, 12, 16, 12, 25],
    wordWrap: true,
  })

  const tests = [
    report.chiSquareTest,
    report.ksTest,
    report.autocorrelationTest,
  ]

  for (const test of tests) {
    testTable.push([
      test.name,
      getStatusColor(test.status) + colors.bold + test.status + colors.reset,
      formatNumber(test.statistic),
      formatNumber(test.pValue),
      test.interpretation,
    ])
  }

  console.log(colors.bold + 'Statistical Test Results:' + colors.reset)
  console.log(testTable.toString())

  // Detailed information
  console.log('\n' + colors.bold + 'Test Details:' + colors.reset)
  for (const test of tests) {
    console.log(`\n  ${colors.bold}${test.name}${colors.reset}`)
    console.log(`    ${test.details}`)
  }

  console.log('\n' + colors.bold + '=' + '='.repeat(78) + colors.reset + '\n')
}

/**
 * Setup CLI commands
 */
program
  .name('lotti')
  .description('Lottery Statistical Analysis Tool')
  .version('1.0.0')

program
  .command('analyze <gameId>')
  .description('Analyze lottery draws for statistical randomness')
  .option(
    '-f, --file <path>',
    'Path to CSV file with lottery records',
    './lottery_data.csv',
  )
  .option(
    '-c, --config <config>',
    'Game configuration (pick5, powerball, etc)',
    'pick5',
  )
  .action(async (gameId: string, options: any) => {
    try {
      // Define game configurations
      const gameConfigs: { [key: string]: GameConfig } = {
        pick5: {
          mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
        },
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
        console.error(
          `❌ Unknown game configuration: ${options.config}`,
        )
        console.error(
          `Available options: ${Object.keys(gameConfigs).join(', ')}`,
        )
        process.exit(1)
      }

      // Initialize services
      const repository = new CsvLotteryRepository(options.file)
      const analyzeGame = new AnalyzeGame(repository, gameConfig)

      // Execute analysis
      console.log(`\n${colors.cyan}Analyzing ${gameId} from ${options.file}...${colors.reset}`)
      const report = await analyzeGame.execute(gameId)

      // Print results
      printResults(report)
      process.exit(0)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`\n${colors.red}❌ Error: ${message}${colors.reset}\n`)
      process.exit(1)
    }
  })

program.parse(process.argv)

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
