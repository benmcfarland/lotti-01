import type { Draw } from '../Draw'
import type { GameConfig, PoolConfig } from '../interfaces/GameConfig'

/**
 * Result of the Kolmogorov-Smirnov test.
 */
export interface KSTestResult {
  readonly dStatistic: number
  readonly empiricalMean: number
  readonly empiricalStdDev: number
  readonly theoreticalMean: number
  readonly theoreticalStdDev: number
  readonly classification: 'Random' | 'Patterned'
  readonly sums: number[]
}

/**
 * Approximation of the error function erf(x) using Abramowitz and Stegun approximation.
 * Used to compute the cumulative normal distribution.
 */
function erf(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)

  const t = 1 / (1 + p * x)
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

/**
 * Standard normal cumulative distribution function Φ(x) = P(Z ≤ x)
 * Using the relationship: Φ(x) = (1 + erf(x / √2)) / 2
 */
function normalCDF(x: number): number {
  return (1 + erf(x / Math.sqrt(2))) / 2
}

/**
 * Calculate theoretical mean and variance for a uniform distribution over a range.
 * For a discrete uniform distribution on [a, b]:
 * - Mean = (a + b) / 2
 * - Variance = ((b - a + 1)² - 1) / 12
 */
function calculateTheoretical(
  poolConfig: PoolConfig,
  count: number
): {
  mean: number
  variance: number
  stdDev: number
} {
  const { minNumber, maxNumber } = poolConfig
  const n = maxNumber - minNumber + 1

  // Mean of a single draw from uniform [minNumber, maxNumber]
  const singleMean = (minNumber + maxNumber) / 2

  // Variance of a single draw from discrete uniform distribution
  const singleVariance = ((n + 1) * (n - 1)) / 12

  // For sum of `count` independent draws:
  const meanSum = singleMean * count
  const varianceSum = singleVariance * count
  const stdDevSum = Math.sqrt(varianceSum)

  return {
    mean: meanSum,
    variance: varianceSum,
    stdDev: stdDevSum,
  }
}

/**
 * Kolmogorov-Smirnov test for normality of draw sums.
 *
 * Process:
 * 1. Calculate the sum of numbers for each draw
 * 2. Compute theoretical mean and variance from game config
 * 3. Calculate empirical and theoretical CDFs at each sum value
 * 4. D-statistic = max|empirical CDF - theoretical CDF|
 * 5. Classify as 'Random' (D ≤ threshold) or 'Patterned' (D > threshold)
 *
 * @param draws Array of lottery draws
 * @param config Game configuration
 * @returns KSTestResult with D-statistic and classification
 */
export function calculateKSTest(draws: Draw[], config: GameConfig): KSTestResult {
  if (!draws || draws.length === 0) {
    throw new Error('draws array cannot be empty')
  }

  const pool = config.mainPool

  // Step 1: Calculate sum for each draw
  const sums = draws.map(draw => {
    const sum = draw.numbers.reduce((acc, num) => acc + num, 0)
    return sum
  })

  // Step 2: Calculate empirical mean and standard deviation
  const n = sums.length
  const empiricalMean = sums.reduce((a, b) => a + b, 0) / n
  const variance = sums.reduce((acc, sum) => acc + (sum - empiricalMean) ** 2, 0) / n
  const empiricalStdDev = Math.sqrt(variance)

  // Step 3: Calculate theoretical mean and variance
  const theoretical = calculateTheoretical(pool, pool.count)

  // Step 4: Sort sums for empirical CDF calculation
  const sortedSums = [...sums].sort((a, b) => a - b)

  // Step 5: Calculate D-statistic
  let dStatistic: number = 0

  for (let i = 0; i < n; i++) {
    // Empirical CDF at sorted sum: (i + 1) / n
    const empiricalCDF = (i + 1) / n

    // Theoretical CDF using normal distribution
    const standardized = ((sortedSums[i] ?? 0) - theoretical.mean) / theoretical.stdDev
    const theoreticalCDF = normalCDF(standardized)

    // Track maximum absolute difference
    const diff = Math.abs(empiricalCDF - theoreticalCDF)
    dStatistic = Math.max(dStatistic, diff)
  }

  // Step 6: Classify based on D-statistic
  // Use a threshold derived from KS critical values
  // For n ≈ 50, critical value ≈ 0.188 at α=0.05
  // We use a slightly more lenient threshold to account for small samples
  const threshold = 0.2

  const classification: 'Random' | 'Patterned' = dStatistic <= threshold ? 'Random' : 'Patterned'

  return {
    dStatistic,
    empiricalMean,
    empiricalStdDev,
    theoreticalMean: theoretical.mean,
    theoreticalStdDev: theoretical.stdDev,
    classification,
    sums,
  }
}
