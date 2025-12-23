## Contributing to Lotti

Thanks for wanting to contribute! This document explains the repository layout, coding conventions and the exact steps to add a new picking strategy.

**Quick commands**
- Install deps: `npm install`
- Build: `npm run build`
- Run tests: `npm test`
- Lint: `npm run lint`
- Auto-fix lint: `npm run lint:fix`
- Format: `npm run format`

---

### Project layout (important files)
- `src/` — TypeScript source
  - `src/infrastructure/` — concrete adapters and strategies (existing: `RandomPickingStrategy`, `TheBalancerStrategy`)
  - `src/domain/interfaces/IPickingStrategy.ts` — the strategy interface to implement
  - `src/infrastructure/PCG32RandomProvider.ts` — RNG provider used by strategies
  - `src/cli/index.ts` — CLI entrypoint; register your strategy here
- `tests/` — unit & integration tests
- `dist/` — compiled output (gitignored)

---

### How to add a new strategy

1. Implement the strategy class

 - Create a new file under `src/infrastructure/`, e.g. `MyStrategy.ts`.
 - Import `IPickingStrategy` and `PoolConfig` (or the game config types) from the domain interfaces.
 - Implement the `IPickingStrategy` interface. At minimum implement these methods:

  - `generateMainPoolPick(pool: PoolConfig): Promise<number[]>`
  - `generateBonusPoolPick(pool: PoolConfig): Promise<number[]>` (if bonus pool exists; may return `[]`)

Example minimal skeleton:

```ts
import type { IPickingStrategy } from '../domain/interfaces/IPickingStrategy'
import type { PoolConfig } from '../domain/interfaces/GameConfig'
import type { IRandomProvider } from '../domain/IRandomProvider'

export class MyStrategy implements IPickingStrategy {
  constructor(private rng: IRandomProvider) {}

  async generateMainPoolPick(pool: PoolConfig): Promise<number[]> {
    // implement selection logic here
    return []
  }

  async generateBonusPoolPick(pool: PoolConfig): Promise<number[]> {
    return []
  }
}
```

Notes:
- Accept an `IRandomProvider` (or create/seed your own RNG) so behavior is deterministic in tests.
- Keep methods `async` if you need any async I/O; other code expects Promises.

2. Add tests

 - Add tests in `tests/infrastructure/`, following existing strategy tests (`randomPickingStrategy.spec.ts`, `theBalancerStrategy.spec.ts`).
 - Tests should verify: correct number of picks, no duplicates, correct ranges, reproducibility when RNG seeded.

3. Register your strategy in the CLI

 - Open `src/cli/index.ts` and import your strategy at the top:

```ts
import { MyStrategy } from '../infrastructure/MyStrategy'
```

 - In the `pick` command where strategies are chosen (search for the `switch (options.strategy.toLowerCase())` block), add a case:

```ts
case 'mystrategy':
  strategy = new MyStrategy(rng)
  break
```

 - In the `simulate` command (where the simulator is created) add your strategy to the available set or `switch` as above so `lotti simulate` can exercise it. Example map approach used elsewhere:

```ts
const strategies: { [key: string]: IPickingStrategy } = {
  balancer: new TheBalancerStrategy(rng),
  random: new RandomPickingStrategy(rng),
  mystrategy: new MyStrategy(rng),
}

const strategy = strategies[options.strategy.toLowerCase()]
```

4. Build and run tests

```bash
npm run lint:fix
npm run format
npm test
npm run build
```

If lint reports issues that cannot be automatically fixed, address them in your code. The repo already includes ESLint + Prettier configs — follow them.

---

Coding guidelines
- Use TypeScript and prefer strict types. The project uses `strict` TS options.
- Keep changes small and add unit tests for new behavior.
- Run `npm run lint` and `npm run format` before committing.

Pull requests
- Base work on the `feature/phase-4` branch (or the branch your team uses).
- Include a short description of the strategy, rationale, and tests added.

Thanks — happy hacking! If you want, I can scaffold `src/infrastructure/MyStrategy.ts` and a test for you to get started.
