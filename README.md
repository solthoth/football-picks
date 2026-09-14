# Football Picks

A small web app for tracking a season-long NFL pool among friends. Each week,
participants pick a winner for every game and submit a tiebreaker guess; this
app shows who's leading, how each pick turned out, and — once a week is fully
decided — who won it.

## Overview

Pick pools are usually run by hand off a spreadsheet or a group chat. This app
turns the weekly picks and results into something browsable: pick a season and
week, see a ranked leaderboard, and drill into any participant's picks vs. the
actual game outcomes.

There's no backend and no database — it's a static site. All data (games,
picks, results) lives in committed YAML files and is bundled at build time.

## Key Features

- **Season/week selection** — a landing page to jump to any tracked week.
- **Leaderboard** — participants ranked by correct picks, with ties sharing a
  rank.
- **Per-participant detail** — every pick compared against the actual result
  (correct / incorrect / pending), plus their tiebreaker guess.
- **Week-winner tiebreaker** — the pool's payout rule (rank by correct picks,
  excluding the week's last game; break ties on that game's outcome; fall back
  to the closest tiebreaker guess) is implemented in
  [`src/domain/weekWinner.ts`](src/domain/weekWinner.ts) and surfaced as a
  "Week Winner" badge once a winner can be determined.
- **Mobile-first** — built with [MUI](https://mui.com/), with a responsive
  leaderboard/picks layout (table on larger screens, cards on phones).
- **Bookmarkable routes** — every view (`/`, `/season/:season/week/:week`,
  `/season/:season/week/:week/participant/:name`) is a real URL.

## Repository Structure

```
data/                 Committed pool data: one picks file and one or more
                       results files per season/week (see below)
scripts/               Tooling for generating results data (see below)
src/
  data/                Loads and merges data/*.yaml into typed Pool records
  domain/              Pure business logic (standings, week-winner rule)
  components/          Presentational UI components
  pages/                Route-level components (wire components to the router)
```

### Data files

Each week has:

- A **picks file** (e.g. `data/nfl_pool_week-1.yaml`) — the season/week, the
  list of games, and every participant's picks and tiebreaker guess.
- One or more **results files** (e.g.
  `data/nfl_pool_week-1_results-20260913.yaml`) — game scores and status. When
  several exist for the same week, the app uses whichever has the latest date
  suffix in its filename.

Add a new week by dropping in a new picks file; update scores by refreshing
(or replacing) its results file. No code changes needed.

### Generating results data

[`scripts/gemini_ai_studio_prompt.md`](scripts/gemini_ai_studio_prompt.md) is a
prompt template for [Google AI Studio](https://aistudio.google.com/): paste it
in (with Grounding via Google Search turned on) alongside a picks file, and it
returns a results YAML in the schema this app expects.

## Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [pnpm](https://pnpm.io/) (this repo pins it via the `packageManager` field —
  run `corepack enable pnpm` if you don't have it)

## Getting Started

```bash
pnpm install
# install git hooks (commit-msg + pre-commit) — requires the pre-commit tool
# (https://pre-commit.com): `brew install pre-commit` or `pipx install pre-commit`
pre-commit install --hook-type pre-commit --hook-type commit-msg
pnpm dev
```

## Commands

| Command            | What it does                                                     |
| ------------------ | ------------------------------------------------------------------ |
| `pnpm dev`         | Start the Vite dev server with HMR.                                |
| `pnpm build`       | Type-check (`tsc -b`) and build the production bundle to `dist/`.  |
| `pnpm preview`     | Serve the built `dist/` locally to verify the production output.   |
| `pnpm lint`        | Run ESLint across the repo.                                        |
| `pnpm typecheck`   | Type-check only (`tsc -b`), no build output.                       |
| `pnpm test`        | Run the Vitest unit suite once.                                    |
| `pnpm test:watch`  | Run Vitest in watch mode.                                          |

## Testing

Unit and component tests (Vitest + Testing Library) live next to the code
they cover (`*.test.ts(x)`). `pnpm test` runs the whole suite; it's also the
gate enforced by the pre-commit hook and CI.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
and are validated by commitlint via a git hook. The same `lint`, `build`, and
`test` commands run in CI on every push and pull request.

## Documentation

See [`CLAUDE.md`](CLAUDE.md) for the fuller technical reference (TypeScript
project layout, ESLint config, commit hygiene, CI details) used to guide
AI-assisted changes to this repo.

## Ownership

Personal project, maintained by [@solthoth](https://github.com/solthoth).
