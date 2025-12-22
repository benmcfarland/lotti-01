import type { ILotteryRepository } from '../domain/ILotteryRepository';
import type { GameConfig } from '../domain/interfaces/GameConfig';
import type { AnalysisReport } from './AnalysisReport';
/**
 * AnalyzeGame application service.
 *
 * Orchestrates the statistical analysis workflow:
 * 1. Load draw history from repository
 * 2. Execute Chi-Square, K-S, and Autocorrelation domain tests
 * 3. Aggregate results into a comprehensive report
 *
 * Dependency injection: repository and config are provided by the caller.
 */
export declare class AnalyzeGame {
    private readonly repository;
    private readonly gameConfig;
    constructor(repository: ILotteryRepository, gameConfig: GameConfig);
    /**
     * Execute the analysis workflow.
     * Loads history and runs all statistical tests.
     *
     * @param gameId Identifier for the game being analyzed
     * @returns AnalysisReport with aggregated test results
     */
    execute(gameId: string): Promise<AnalysisReport>;
}
//# sourceMappingURL=AnalyzeGame.d.ts.map