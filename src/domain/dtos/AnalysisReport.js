"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determinePoolStatus = determinePoolStatus;
exports.determineOverallStatus = determineOverallStatus;
/**
 * Determine status based on p-value threshold.
 * - Significant: p < 0.05 (evidence of non-randomness)
 * - Normal: 0.05 ≤ p < 0.10 (borderline region)
 * - Suspicious: p ≥ 0.10 (insufficient evidence of pattern)
 */
function determinePoolStatus(pValues) {
    // Use the minimum p-value from the three tests (most conservative)
    const minPValue = Math.min(...pValues);
    if (minPValue < 0.05) {
        return 'Significant';
    }
    else if (minPValue < 0.10) {
        return 'Normal';
    }
    else {
        return 'Suspicious';
    }
}
/**
 * Determine overall status from both pool statuses.
 * Overall status is the most critical of the two pools.
 * Priority: Significant > Normal > Suspicious
 */
function determineOverallStatus(mainPoolStatus, bonusPoolStatus) {
    if (mainPoolStatus === 'Significant' || bonusPoolStatus === 'Significant') {
        return 'Significant';
    }
    if (mainPoolStatus === 'Normal' || bonusPoolStatus === 'Normal') {
        return 'Normal';
    }
    return 'Suspicious';
}
//# sourceMappingURL=AnalysisReport.js.map