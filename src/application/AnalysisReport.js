"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineStatus = determineStatus;
exports.aggregateStatus = aggregateStatus;
/**
 * Determine test status based on p-value and interpretation.
 * PASS: p-value > 0.05 (statistically consistent with randomness)
 * WARN: p-value 0.01-0.05 (borderline, possible pattern)
 * FAIL: p-value < 0.01 (strong evidence of non-randomness)
 */
function determineStatus(pValue, isSignificant) {
    if (pValue > 0.05 || !isSignificant) {
        return 'PASS';
    }
    else if (pValue > 0.01) {
        return 'WARN';
    }
    else {
        return 'FAIL';
    }
}
/**
 * Calculate overall status from individual test results.
 * FAIL if any test fails
 * WARN if any test warns
 * PASS if all tests pass
 */
function aggregateStatus(statuses) {
    if (statuses.includes('FAIL'))
        return 'FAIL';
    if (statuses.includes('WARN'))
        return 'WARN';
    return 'PASS';
}
//# sourceMappingURL=AnalysisReport.js.map