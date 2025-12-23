# SimulateStrategy Implementation Summary

## Overview

**SimulateStrategy** is an application service that runs a dual-track simulation to prove that a lottery picking strategy performs identically to random selection over large sample sizes.

## Key Components

### 1. RandomPickingStrategy (`src/infrastructure/RandomPickingStrategy.ts`)
- Implements `IPickingStrategy` for pure random lottery number selection
- Uses Fisher-Yates shuffle for uniform distribution
- No constraints or optimization applied
- Serves as the baseline for comparison

**Key Methods:**
- `generateMainPoolPick()` - Select k random distinct numbers from main pool
- `generateBonusPoolPick()` - Select bonus numbers if configured

**Properties:**
- ✓ Uniform distribution across pool
- ✓ No duplicates within a single pick
- ✓ Deterministic when seeded (reproducible results)

### 2. SimulateStrategy (`src/application/SimulateStrategy.ts`)
- Orchestrates a 10,000-iteration dual-track simulation
- Compares a chosen strategy against pure random picking
- Calculates ROI and divergence metrics

**Key Methods:**
- `execute(gameId, targetNumbers, targetBonus?, iterations?)` - Run the simulation

**Output (SimulationReport):**
```typescript
{
  gameId: string
  iterations: number
  targetNumbers: number[]
  targetBonus?: number
  strategyTrack: SimulationTrackResult    // Strategy performance
  randomTrack: SimulationTrackResult      // Random baseline
  divergence: number                       // Strategy ROI - Random ROI
  conclusion: string                       // Human-readable interpretation
  timestamp: string
}
```

## How It Works

### Simulation Flow

1. **Setup Phase**
   - Validate target numbers are within pool ranges
   - Calculate expected matches via combinatorial probability
   - Initialize both tracks (strategy and random)

2. **Strategy Track (10,000 iterations)**
   - Execute chosen strategy N times
   - Count how many iterations match all target numbers
   - Calculate match rate and ROI

3. **Random Track (10,000 iterations)**
   - Execute RandomPickingStrategy N times
   - Count matches using same target numbers
   - Calculate match rate and ROI

4. **Analysis Phase**
   - Calculate divergence: `Strategy ROI - Random ROI`
   - Generate conclusion based on divergence threshold
   - Return comprehensive report

### Key Metrics

**Match Rate**
- `matches / iterations` (0.0 to 1.0)
- Probability of hitting all numbers in a single draw

**Expected Matches**
- Calculated via combinatorial probability
- `C(poolSize, count)` for main pool
- Multiplied by `1/bonusPoolSize` if bonus pool exists

**ROI (Return on Investment)**
- `(actualMatches / expectedMatches - 1) × 100`
- Positive ROI: strategy beats expected
- Zero ROI: matches exactly expected
- Negative ROI: underperforms expected
- 0%: no matches in track

**Divergence**
- `Strategy ROI - Random ROI`
- Threshold: ±5% (allows for statistical variation)
- Near-zero divergence proves identical performance

## Expected Behavior

For a properly functioning strategy:

```
Scenario: 10,000 iterations each, Pick 5 from [1-50]

Expected Matches (random): ~0.5 per track
Strategy Matches: ~0.5 per track
Divergence: ~0% (within ±5% range)

Conclusion: "Strategy performs identically to random selection"
```

## Mathematical Basis

### Combinatorial Probability
For Pick k from pool of size n:

```
P(exact match) = 1 / C(n, k)

where C(n, k) = n! / (k! × (n-k)!)

Example: Pick 5 from 50
C(50, 5) = 2,118,760
P(match) = 1 / 2,118,760 ≈ 0.000000472
```

### Bonus Pool Probability
If bonus pool exists:

```
P(full match) = P(main match) × P(bonus match)
              = 1/C(n, k) × 1/bonusPoolSize
```

## Test Coverage

### SimulateStrategy Tests (18 tests)
- Simulation setup and report generation
- Divergence calculation accuracy
- Match counting correctness
- ROI calculation validation
- Conclusion generation for different divergence levels
- Input validation (target numbers, counts, bonus ranges)
- Expected matches calculation
- Large sample convergence

### RandomPickingStrategy Tests (12 tests)
- Valid main and bonus pool generation
- Different pool configurations
- Uniform distribution verification
- Reproducibility with seeding
- No duplicates guarantee
- Edge cases (full pool selection, single number)

## Usage Example

```typescript
import { SimulateStrategy } from './src/application/SimulateStrategy'
import { TheBalancerStrategy } from './src/infrastructure/TheBalancerStrategy'
import { PCG32RandomProvider } from './src/infrastructure/PCG32RandomProvider'

// Setup
const rng = new PCG32RandomProvider()
rng.seed('test-seed')

const gameConfig = {
  mainPool: { minNumber: 1, maxNumber: 50, count: 5 },
}

const strategy = new TheBalancerStrategy(rng)
const simulator = new SimulateStrategy(strategy, rng, gameConfig)

// Run simulation
const report = await simulator.execute(
  'simulation-001',
  [10, 20, 30, 40, 50],  // target numbers
  undefined,              // no bonus
  10000                   // iterations
)

// Analyze results
console.log(`Divergence: ${report.divergence.toFixed(2)}%`)
console.log(report.conclusion)
```

## Key Insights

1. **Statistical Equivalence**: Over large samples (10,000+), any lottery picking strategy should converge to the same performance as random selection

2. **Divergence Interpretation**:
   - **|divergence| < 5%**: Strategy is equivalent to random (expected)
   - **divergence > 5%**: Strategy may have edge (needs verification)
   - **divergence < -5%**: Random outperforms strategy (indicates weakness)

3. **Why Convergence Matters**: Proves that systematic picking strategies don't provide mathematical advantage in truly random drawings

4. **Reproducibility**: Seeded RNG ensures same target across test/strategy runs

## Integration Points

- Uses `IPickingStrategy` interface for testable strategy abstraction
- Depends on `IRandomProvider` for deterministic/reproducible results
- Works with any `GameConfig` (pick5, powerball, megamillions)
- Returns structured DTO for CLI/reporting integration

## Test Results

```
✓ SimulateStrategy Tests (18 tests) - All passing
✓ RandomPickingStrategy Tests (12 tests) - All passing
✓ Total project tests: 111 passing
```

## Files Created

- `src/application/SimulateStrategy.ts` - Main simulation service
- `src/infrastructure/RandomPickingStrategy.ts` - Random baseline strategy
- `tests/application/simulateStrategy.spec.ts` - Comprehensive test suite
- `tests/infrastructure/randomPickingStrategy.spec.ts` - Strategy tests
- `examples/simulateStrategy.ts` - Usage example and documentation
