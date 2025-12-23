# Lotti: Lottery Statistical Analysis Tool

A command-line tool for analyzing lottery draws and generating picks using evidence-based strategies. Lotti performs rigorous statistical testing on historical lottery data and provides dual-track simulation comparisons to validate strategy performance.

## Installation

### Prerequisites

- Node.js 18+ and npm

### Install via npm link

1. Clone the repository and navigate to the project directory:

   ```bash
   git clone https://github.com/benmcfarland/lotti-01.git
   cd lotti-01
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build TypeScript to JavaScript:

   ```bash
   npm run build
   ```

4. Create a global symlink to use `lotti` command anywhere:

   ```bash
   npm link
   ```

5. Verify installation:
   ```bash
   lotti --version
   lotti --help
   ```

## Usage

Lotti provides three main commands for lottery analysis and picking:

### 1. Analyze Command

Analyze historical lottery draws for statistical randomness across multiple test dimensions.

```bash
lotti analyze <gameId> [options]
```

**Options:**

- `-f, --file <path>` - Path to CSV file with lottery records (default: `./lottery_data.csv`)
- `-c, --config <config>` - Game configuration: `pick5`, `powerball`, or `megamillions` (default: `pick5`)

**Example:**

```bash
lotti analyze pick5 -f lottery_data.csv -c pick5
```

**Output:**
Displays a comprehensive statistical report including:

- Chi-square test for distribution uniformity
- Kolmogorov-Smirnov test for distribution fit
- Autocorrelation analysis for sequential dependencies
- Ball set analysis for number frequency patterns
- Overall assessment with color-coded results (PASS/WARN/FAIL)

### 2. Pick Command

Generate a lottery pick using a specified strategy.

```bash
lotti pick <gameId> [options]
```

**Options:**

- `-s, --strategy <name>` - Strategy: `balancer` or `random` (default: `balancer`)
- `-c, --config <config>` - Game configuration: `pick5`, `powerball`, or `megamillions` (default: `pick5`)
- `--seed <seed>` - RNG seed for reproducibility (default: `default-seed`)

**Example:**

```bash
lotti pick test-game -s balancer -c pick5
```

**Output:**

```
🎰 LOTTERY PICK
──────────────────────────────────────────────────
Main Numbers: 12 25 38 41 49
──────────────────────────────────────────────────
```

### 3. Simulate Command

Run a dual-track simulation comparing a strategy against random picking over 10,000 iterations.

```bash
lotti simulate <gameId> [options]
```

**Options:**

- `-s, --strategy <name>` - Strategy to test: `balancer` or `random` (default: `balancer`)
- `-c, --config <config>` - Game configuration: `pick5`, `powerball`, or `megamillions` (default: `pick5`)
- `-t, --target <numbers>` - Target numbers to match (comma-separated, default: `1,2,3,4,5`)
- `-b, --bonus <number>` - Optional bonus number to match
- `-i, --iterations <number>` - Iterations per track (default: `10000`)
- `--seed <seed>` - RNG seed for reproducibility (default: `simulation-seed`)

**Example:**

```bash
lotti simulate test-game -s balancer -c powerball -t "10,20,30,40,50" -b 15 -i 5000
```

**Output:**

```
SIMULATION RESULTS: Strategy vs Random
──────────────────────────────────────────────────────────────────────────────
Simulation Parameters:
  Game ID: test-game
  Iterations per track: 5,000
  Target numbers: [10, 20, 30, 40, 50]
  Target bonus: 15

[Results table with matches, match rates, expected matches, and ROI]

Divergence Analysis:
  Divergence: 2.15%
  (Strategy ROI - Random ROI)

Conclusion:
  Strategy performs identically to random selection (within acceptable variance)
```

## Game Configurations

Lotti supports three lottery game configurations:

| Config         | Main Pool | Count | Bonus Pool | Bonus Count |
| -------------- | --------- | ----- | ---------- | ----------- |
| `pick5`        | 1-50      | 5     | None       | -           |
| `powerball`    | 1-69      | 5     | 1-26       | 1           |
| `megamillions` | 1-70      | 5     | 1-25       | 1           |

## Strategies

### Balancer Strategy

A picking strategy that generates selections with balanced number distributions, avoiding extreme patterns that are statistically unlikely to occur.

### Random Strategy

Pure random selection using uniform distribution across the pool. Used as the baseline for comparison simulations.

## Statistical Tests

The analyze command performs the following rigorous statistical tests:

1. **Chi-Square Test** - Evaluates whether observed number frequencies match expected uniform distribution
2. **Kolmogorov-Smirnov Test** - Measures goodness-of-fit for distribution conformity
3. **Autocorrelation Analysis** - Detects sequential dependencies or patterns in draws
4. **Ball Set Analysis** - Identifies frequency patterns in number occurrences

All tests use a significance level of α = 0.05 (p-value > 0.05 indicates randomness).

## Running Tests

```bash
npm test
```

Runs the full test suite using Vitest covering:

- Statistical analysis accuracy
- Simulation correctness
- CSV repository parsing
- RNG reproducibility
- Picking strategy distribution validation

## ⚠️ STATISTICAL DISCLAIMER

**This tool is provided for educational and analytical purposes only.**

### Important Legal Notice

- **Lotteries are games of chance.** The statistical analysis provided by this tool, while mathematically rigorous, cannot predict lottery outcomes or guarantee winnings.
- **No proven predictive power.** Despite the statistical patterns analyzed, lottery drawings are designed to be random and unpredictable. No picking strategy, methodology, or system can systematically beat randomness over time.
- **Simulation results do not imply strategy superiority.** The dual-track simulations demonstrate that tested strategies perform statistically identical to random selection, confirming the effectiveness of lottery randomization.
- **Not investment or gambling advice.** This tool should not be used as a basis for any financial decision or gambling activity. Lottery participation carries financial risk.
- **Responsible use only.** If you choose to participate in lotteries, do so responsibly and within your means. Gambling can lead to financial loss and should never be viewed as a source of income.

**Use this tool for statistical education and curiosity only. The creators and contributors bear no responsibility for how this tool is used or any consequences resulting from its use.**

## Development

### Project Structure

```
lotti-01/
├── src/
│   ├── application/      # Business logic (analyze, simulate, etc.)
│   ├── domain/           # Core entities and statistical algorithms
│   │   └── math/         # Statistical test implementations
│   ├── infrastructure/   # CSV repository, RNG, strategies
│   └── cli/              # Command-line interface
├── tests/                # Full test coverage
├── examples/             # Usage examples
├── package.json          # Dependencies and scripts
└── lottery_data.csv      # Sample lottery data
```

### Build and Run

````bash
# Build TypeScript
npm run build

# Run tests
npm test

# Run CLI directly with ts-node (during development)
npx ts-node src/cli/index.ts --help

### Build Output

The TypeScript build outputs all compiled JavaScript and declaration files to the `dist/` folder, preserving the original directory structure from `src/`. The build includes:

- **JavaScript files** (.js) - Compiled output ready to execute
- **TypeScript declarations** (.d.ts) - Type definitions for IDE support
- **Source maps** (.map) - Debugging support

After building, run the compiled CLI:

```bash
# Run the compiled CLI
node dist/cli/index.js --help

# Or use the npm start script
npm start
````

```

## License

ISC

## References

- Durstenfeld, R. (1964). "Algorithm 235: Random permutation." Communications of the ACM, 7(7), 420.
- Knuth, D. E. (1997). The Art of Computer Programming, Vol. 2: Seminumerical Algorithms.
- Press, W. H., et al. (2007). Numerical Recipes: The Art of Scientific Computing (3rd ed.).
```
