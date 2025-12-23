#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const cli_table3_1 = __importDefault(require("cli-table3"));
const AnalyzeGame_1 = require("../application/AnalyzeGame");
const SimulateStrategy_1 = require("../application/SimulateStrategy");
const CsvLotteryRepository_1 = require("../infrastructure/CsvLotteryRepository");
const TheBalancerStrategy_1 = require("../infrastructure/TheBalancerStrategy");
const RandomPickingStrategy_1 = require("../infrastructure/RandomPickingStrategy");
const PCG32RandomProvider_1 = require("../infrastructure/PCG32RandomProvider");
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
};
/**
 * Get status color code based on test result status
 */
function getStatusColor(status) {
    switch (status) {
        case 'PASS':
            return colors.green;
        case 'WARN':
            return colors.yellow;
        case 'FAIL':
            return colors.red;
        default:
            return colors.reset;
    }
}
/**
 * Format a number to fixed decimal places
 */
function formatNumber(num, decimals = 4) {
    return num.toFixed(decimals);
}
/**
 * Print a simple progress indicator
 */
function printProgress(current, total, label = '') {
    const percent = Math.round((current / total) * 100);
    const barLength = 30;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r  ${label} [${bar}] ${percent}%`);
}
/**
 * Print a formatted lottery pick
 */
function printPick(mainNumbers, bonusNumbers) {
    console.log('\n' + colors.bold + colors.cyan + '🎰 LOTTERY PICK' + colors.reset);
    console.log('─'.repeat(50));
    const mainStr = mainNumbers.map((n) => colors.bold + n.toString().padStart(2) + colors.reset).join(' ');
    console.log(`Main Numbers: ${mainStr}`);
    if (bonusNumbers && bonusNumbers.length > 0) {
        const bonusStr = bonusNumbers.map((n) => colors.green + n.toString().padStart(2) + colors.reset).join(' ');
        console.log(`Bonus Numbers: ${bonusStr}`);
    }
    console.log('─'.repeat(50) + '\n');
}
/**
 * Print simulation progress with detailed table
 */
function printSimulationResults(report) {
    console.log('\n' + colors.bold + '=' + '='.repeat(78) + colors.reset);
    console.log(colors.bold + colors.cyan + 'SIMULATION RESULTS: Strategy vs Random' + colors.reset);
    console.log(colors.bold + '=' + '='.repeat(78) + colors.reset + '\n');
    // Header info
    console.log(colors.bold + 'Simulation Parameters:' + colors.reset);
    console.log(`  Game ID: ${report.gameId}`);
    console.log(`  Iterations per track: ${report.iterations.toLocaleString()}`);
    console.log(`  Target numbers: [${report.targetNumbers.join(', ')}]`);
    if (report.targetBonus) {
        console.log(`  Target bonus: ${report.targetBonus}`);
    }
    console.log();
    // Results table
    const resultsTable = new cli_table3_1.default({
        head: [
            colors.bold + 'Metric' + colors.reset,
            colors.bold + 'Strategy' + colors.reset,
            colors.bold + 'Random' + colors.reset,
        ],
        colWidths: [25, 20, 20],
    });
    resultsTable.push(['Matches', report.strategyTrack.matchesCount.toString(), report.randomTrack.matchesCount.toString()], [
        'Match Rate',
        (report.strategyTrack.matchRate * 100).toFixed(4) + '%',
        (report.randomTrack.matchRate * 100).toFixed(4) + '%',
    ], [
        'Expected Matches',
        formatNumber(report.strategyTrack.expectedMatches, 1),
        formatNumber(report.randomTrack.expectedMatches, 1),
    ], [
        'ROI',
        report.strategyTrack.roi.toFixed(2) + '%',
        report.randomTrack.roi.toFixed(2) + '%',
    ]);
    console.log(colors.bold + 'Results:' + colors.reset);
    console.log(resultsTable.toString());
    // Divergence
    console.log(colors.bold + '\nDivergence Analysis:' + colors.reset);
    const divergenceColor = Math.abs(report.divergence) < 5 ? colors.green : Math.abs(report.divergence) < 10 ? colors.yellow : colors.red;
    console.log(`  Divergence: ${divergenceColor}${report.divergence.toFixed(2)}%${colors.reset}`);
    console.log(`  (Strategy ROI - Random ROI)`);
    // Conclusion
    console.log(colors.bold + '\nConclusion:' + colors.reset);
    console.log(`  ${report.conclusion}`);
    console.log(colors.bold + '=' + '='.repeat(78) + colors.reset + '\n');
}
/**
 * Format a number to fixed decimal places
 */
/**
 * Print analysis results as formatted tables
 */
function printResults(report) {
    console.log('\n' + colors.bold + '=' + '='.repeat(78) + colors.reset);
    console.log(colors.bold + colors.cyan + 'LOTTI STATISTICAL ANALYSIS REPORT' + colors.reset);
    console.log(colors.bold + '=' + '='.repeat(78) + colors.reset + '\n');
    // Header information
    const headerTable = new cli_table3_1.default({
        colWidths: [20, 60],
        wordWrap: true,
    });
    headerTable.push(['Game ID', report.gameId], ['Analysis Time', report.timestamp], ['Number of Draws', report.drawCount.toString()], [
        'Overall Status',
        getStatusColor(report.overallStatus) + colors.bold + report.overallStatus + colors.reset,
    ]);
    console.log(headerTable.toString());
    console.log(colors.bold + '\nOverall Interpretation:' + colors.reset);
    console.log(`  ${report.overallInterpretation}`);
    console.log(colors.bold + '\nSummary:' + colors.reset);
    console.log(`  ${report.summary}\n`);
    // Test results table
    const testTable = new cli_table3_1.default({
        head: [
            colors.bold + 'Test Name' + colors.reset,
            colors.bold + 'Status' + colors.reset,
            colors.bold + 'Statistic' + colors.reset,
            colors.bold + 'P-Value' + colors.reset,
            colors.bold + 'Interpretation' + colors.reset,
        ],
        colWidths: [28, 12, 16, 12, 25],
        wordWrap: true,
    });
    const tests = [
        report.chiSquareTest,
        report.ksTest,
        report.autocorrelationTest,
    ];
    for (const test of tests) {
        testTable.push([
            test.name,
            getStatusColor(test.status) + colors.bold + test.status + colors.reset,
            formatNumber(test.statistic),
            formatNumber(test.pValue),
            test.interpretation,
        ]);
    }
    console.log(colors.bold + 'Statistical Test Results:' + colors.reset);
    console.log(testTable.toString());
    // Detailed information
    console.log('\n' + colors.bold + 'Test Details:' + colors.reset);
    for (const test of tests) {
        console.log(`\n  ${colors.bold}${test.name}${colors.reset}`);
        console.log(`    ${test.details}`);
    }
    console.log('\n' + colors.bold + '=' + '='.repeat(78) + colors.reset + '\n');
}
/**
 * Setup CLI commands
 */
commander_1.program
    .name('lotti')
    .description('Lottery Statistical Analysis Tool')
    .version('1.0.0');
commander_1.program
    .command('analyze <gameId>')
    .description('Analyze lottery draws for statistical randomness')
    .option('-f, --file <path>', 'Path to CSV file with lottery records', './lottery_data.csv')
    .option('-c, --config <config>', 'Game configuration (pick5, powerball, etc)', 'pick5')
    .action(async (gameId, options) => {
    try {
        // Define game configurations
        const gameConfigs = {
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
        };
        const gameConfig = gameConfigs[options.config];
        if (!gameConfig) {
            console.error(`❌ Unknown game configuration: ${options.config}`);
            console.error(`Available options: ${Object.keys(gameConfigs).join(', ')}`);
            process.exit(1);
        }
        // Initialize services
        const repository = new CsvLotteryRepository_1.CsvLotteryRepository(options.file);
        const analyzeGame = new AnalyzeGame_1.AnalyzeGame(repository, gameConfig);
        // Execute analysis
        console.log(`\n${colors.cyan}Analyzing ${gameId} from ${options.file}...${colors.reset}`);
        const report = await analyzeGame.execute(gameId);
        // Print results
        printResults(report);
        process.exit(0);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\n${colors.red}❌ Error: ${message}${colors.reset}\n`);
        process.exit(1);
    }
});
commander_1.program
    .command('pick <gameId>')
    .description('Generate a lottery pick using a specified strategy')
    .option('-s, --strategy <name>', 'Picking strategy (balancer, random)', 'balancer')
    .option('-c, --config <config>', 'Game configuration (pick5, powerball, etc)', 'pick5')
    .option('--seed <seed>', 'RNG seed for reproducibility', 'default-seed')
    .action(async (gameId, options) => {
    try {
        // Define game configurations
        const gameConfigs = {
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
        };
        const gameConfig = gameConfigs[options.config];
        if (!gameConfig) {
            console.error(`❌ Unknown game configuration: ${options.config}`);
            console.error(`Available options: ${Object.keys(gameConfigs).join(', ')}`);
            process.exit(1);
        }
        // Initialize RNG and strategy
        const rng = new PCG32RandomProvider_1.PCG32RandomProvider();
        rng.seed(options.seed);
        let strategy;
        switch (options.strategy.toLowerCase()) {
            case 'balancer':
                strategy = new TheBalancerStrategy_1.TheBalancerStrategy(rng);
                break;
            case 'random':
                strategy = new RandomPickingStrategy_1.RandomPickingStrategy(rng);
                break;
            default:
                console.error(`❌ Unknown strategy: ${options.strategy}`);
                console.error('Available strategies: balancer, random');
                process.exit(1);
        }
        // Generate pick
        console.log(`\n${colors.cyan}Generating pick using ${options.strategy} strategy...${colors.reset}`);
        const mainPick = await strategy.generateMainPoolPick(gameConfig);
        const bonusPick = await strategy.generateBonusPoolPick(gameConfig);
        // Display result
        printPick(mainPick, bonusPick.length > 0 ? bonusPick : undefined);
        process.exit(0);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\n${colors.red}❌ Error: ${message}${colors.reset}\n`);
        process.exit(1);
    }
});
commander_1.program
    .command('simulate <gameId>')
    .description('Simulate strategy performance vs random picking (10,000 iterations each)')
    .option('-s, --strategy <name>', 'Strategy to test (balancer, random)', 'balancer')
    .option('-c, --config <config>', 'Game configuration (pick5, powerball, etc)', 'pick5')
    .option('-t, --target <numbers>', 'Target numbers to match (comma-separated)', '1,2,3,4,5')
    .option('-b, --bonus <number>', 'Optional bonus number to match')
    .option('-i, --iterations <number>', 'Iterations per track', '10000')
    .option('--seed <seed>', 'RNG seed for reproducibility', 'simulation-seed')
    .action(async (gameId, options) => {
    try {
        // Define game configurations
        const gameConfigs = {
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
        };
        const gameConfig = gameConfigs[options.config];
        if (!gameConfig) {
            console.error(`❌ Unknown game configuration: ${options.config}`);
            process.exit(1);
        }
        // Parse target numbers
        const targetNumbers = options.target.split(',').map((s) => parseInt(s.trim(), 10));
        const bonusNumber = options.bonus ? parseInt(options.bonus, 10) : undefined;
        const iterations = parseInt(options.iterations, 10);
        // Validate target count
        if (targetNumbers.length !== gameConfig.mainPool.count) {
            console.error(`❌ Expected ${gameConfig.mainPool.count} target numbers, got ${targetNumbers.length}`);
            process.exit(1);
        }
        // Initialize RNG and strategy
        const rng = new PCG32RandomProvider_1.PCG32RandomProvider();
        rng.seed(options.seed);
        let strategy;
        switch (options.strategy.toLowerCase()) {
            case 'balancer':
                strategy = new TheBalancerStrategy_1.TheBalancerStrategy(rng);
                break;
            case 'random':
                strategy = new RandomPickingStrategy_1.RandomPickingStrategy(rng);
                break;
            default:
                console.error(`❌ Unknown strategy: ${options.strategy}`);
                process.exit(1);
        }
        // Run simulation with progress bar
        console.log(`\n${colors.cyan}Running simulation: ${options.strategy} vs random${colors.reset}`);
        console.log(`Target: [${targetNumbers.join(', ')}]${bonusNumber ? ` + ${bonusNumber}` : ''}`);
        console.log(`Iterations: ${iterations.toLocaleString()} per track\n`);
        const simulator = new SimulateStrategy_1.SimulateStrategy(strategy, rng, gameConfig);
        // Simulate in chunks to show progress
        const chunkSize = Math.max(100, iterations / 100);
        let simulatorFinished = false;
        // Run simulation in background
        const simulationPromise = simulator.execute(gameId, targetNumbers, bonusNumber, iterations);
        // Show progress while waiting
        let progressCount = 0;
        const progressInterval = setInterval(() => {
            if (simulatorFinished) {
                clearInterval(progressInterval);
                return;
            }
            progressCount += 1;
            printProgress(Math.min(progressCount, 100), 100, 'Simulating');
        }, 100);
        const report = await simulationPromise;
        simulatorFinished = true;
        clearInterval(progressInterval);
        // Print final progress and results
        console.log(); // New line after progress bar
        printSimulationResults(report);
        process.exit(0);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\n${colors.red}❌ Error: ${message}${colors.reset}\n`);
        process.exit(1);
    }
});
// Show help if no command provided
if (!process.argv.slice(2).length) {
    commander_1.program.outputHelp();
}
//# sourceMappingURL=index.js.map