import type { Draw } from '../Draw'
import type { GameConfig } from '../interfaces/GameConfig'

/**
 * Chi-Square test result object.
 */
export interface ChiSquareResult {
  readonly chiSquareStatistic: number
  readonly degreesOfFreedom: number
  readonly pValue: number
  readonly binObserved: number[]
  readonly binExpected: number[]
}

/**
 * Approximation of the regularized upper incomplete gamma function Q(a, x) = 1 - P(a, x).
 * Used to compute Chi-Square CDF for p-value calculation.
 * Implements both series and continued fraction methods for numerical stability.
 */
function gammaIncompleteQ(a: number, x: number): number {
  // Use logarithmic form to avoid overflow
  const logGammaA = logGamma(a)
  const logTerm = a * Math.log(x) - x - logGammaA

  if (logTerm < -700) return 1 // exp(logTerm) is essentially 0
  if (logTerm > 700) return 0 // exp(logTerm) is very large

  const gax = Math.exp(logTerm)

  // For x < a + 1, use series expansion
  if (x < a + 1) {
    let sum = 1 / a
    for (let i = 1; i < 200; i++) {
      sum = 1 + (i * sum) / (a + i - x)
      if (Math.abs(i / (a + i - x)) < 1e-14) break
    }
    // Use the recurrence relation for numerical stability
    let result = gax / a
    for (let i = 1; i < 100; i++) {
      result *= x / (a + i)
      if (result < 1e-15) break
    }
    return 1 - result
  } else {
    // Use continued fraction for x >= a + 1
    let b = x + 1 - a
    let c = 1e30
    let d = 1 / b
    let h = d

    for (let i = 1; i < 200; i++) {
      const an = -(i * (i - a))
      b += 2
      d = an * d + b
      if (Math.abs(d) < 1e-30) d = 1e-30
      c = b + an / c
      if (Math.abs(c) < 1e-30) c = 1e-30
      d = 1 / d
      const delta = d * c
      h *= delta
      if (Math.abs(delta - 1) < 1e-14) break
    }
    return gax * h
  }
}

/**
 * Natural log of the gamma function using Lanczos approximation.
 */
function logGamma(x: number): number {
  const g = 7
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]

  if (x < 0.5) {
    // Use reflection formula
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }

  x -= 1
  let base: number = p[0]
  for (let i = 1; i < p.length; i++) {
    base += p[i] / (x + i)
  }

  const t = x + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(base)
}

/**
 * Compute Chi-Square p-value from Chi-Square statistic and degrees of freedom.
 * p-value = P(χ² > chiSq | df) using incomplete gamma function.
 * For a Chi-Square variable with df degrees of freedom:
 * CDF(x, df) = P(χ² ≤ x) = P(df/2, x/2) (lower incomplete gamma)
 * p-value = 1 - CDF(x, df) = Q(df/2, x/2) (upper incomplete gamma)
 */
function chiSquarePValue(chiSq: number, df: number): number {
  if (chiSq < 0 || df <= 0) return 1
  return gammaIncompleteQ(df / 2, chiSq / 2)
}

/**
 * Calculate Chi-Square statistic using Decile Binning to handle small sample sizes.
 *
 * Process:
 * 1. Divide the range [minNumber, maxNumber] into 10 equal-width bins (deciles)
 * 2. Count observed frequency for each bin across all draws
 * 3. Calculate expected frequency (uniform distribution)
 * 4. Compute Chi-Square: Σ((observed - expected)² / expected)
 * 5. Return statistic, degrees of freedom (9), and p-value
 *
 * @param draws Array of lottery draws
 * @param config Game configuration with pool range and count
 * @returns ChiSquareResult with statistic, df, p-value, and bin frequencies
 */
export function calculateChiSquare(draws: Draw[], config: GameConfig): ChiSquareResult {
  if (!draws || draws.length === 0) {
    throw new Error('draws array cannot be empty')
  }

  const pool = config.mainPool
  const minNumber = pool.minNumber
  const maxNumber = pool.maxNumber
  const rangeSize = maxNumber - minNumber + 1

  if (rangeSize < 10) {
    throw new Error('Range must be at least 10 for Decile Binning')
  }

  // Create 10 decile bins
  const numBins = 10
  const binWidth = rangeSize / numBins
  const binObserved = Array(numBins).fill(0)

  // Count observed frequencies in each bin
  let totalObservations = 0
  for (const draw of draws) {
    for (const num of draw.numbers) {
      if (num < minNumber || num > maxNumber) {
        throw new Error(`Number ${num} is outside valid range [${minNumber}, ${maxNumber}]`)
      }
      // Determine which bin this number falls into
      let binIndex = Math.floor((num - minNumber) / binWidth)
      // Edge case: maxNumber should map to the last bin
      if (binIndex >= numBins) binIndex = numBins - 1
      binObserved[binIndex]++
      totalObservations++
    }
  }

  // Calculate expected frequency (uniform distribution across bins)
  const expectedFrequency = totalObservations / numBins
  const binExpected = Array(numBins).fill(expectedFrequency)

  // Calculate Chi-Square statistic
  let chiSquareStatistic = 0
  for (let i = 0; i < numBins; i++) {
    const diff = binObserved[i] - binExpected[i]
    chiSquareStatistic += (diff * diff) / binExpected[i]
  }

  // Degrees of freedom = numBins - 1
  const degreesOfFreedom = numBins - 1

  // Calculate p-value
  const pValue = chiSquarePValue(chiSquareStatistic, degreesOfFreedom)

  return {
    chiSquareStatistic,
    degreesOfFreedom,
    pValue,
    binObserved,
    binExpected,
  }
}
