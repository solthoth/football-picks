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
  to the closest tiebreaker guess; split the win as co-winners if that guess
  is itself an exact tie) is implemented in
  [`src/domain/weekWinner.ts`](src/domain/weekWinner.ts) and surfaced as a
  "Week Winner" badge, with a confetti celebration
  ([`src/components/WinnerCelebration.tsx`](src/components/WinnerCelebration.tsx))
  once a winner can be determined.
- **Team logos** — every matchup and pick shows the two teams' logos
  ([`src/components/TeamLogo.tsx`](src/components/TeamLogo.tsx)), sourced from
  the NFL's own CDN (see [Team logos](#team-logos) below).
- **Mobile-first** — built with [MUI](https://mui.com/), with a responsive
  leaderboard/picks layout (table on larger screens, cards on phones).
- **Bookmarkable routes** — every view (`/`, `/season/:season/week/:week`,
  `/season/:season/week/:week/participant/:name`) is a real URL.

## Repository Structure

```
data/                  Committed pool data: one picks file and one or more
                       results files per season/week (see below)
scripts/               Python tooling for generating schedule/results data
                       and fixing up picks files (see Scripts below)
src/
  assets/team-logos/   Team logo SVGs (see Team logos below)
  data/                Loads and merges data/*.yaml into typed Pool records,
                       plus the team-name -> logo lookup (teamLogos.ts)
  domain/              Pure business logic (standings, week-winner rule)
  components/          Presentational UI components
  pages/               Route-level components (wire components to the router)
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

### Scripts

Four ways to populate/fix up `data/*.yaml`, all under `scripts/`:

- [`gemini_ai_studio_prompt.md`](scripts/gemini_ai_studio_prompt.md) — a
  prompt template for [Google AI Studio](https://aistudio.google.com/): paste
  it in (with Grounding via Google Search turned on) alongside a picks file,
  and it returns a results YAML in the schema this app expects.
- [`fetch_nfl_schedule.py`](scripts/fetch_nfl_schedule.py) — fetches the
  regular-season schedule and live/final scores directly from NFL.com's own
  (undocumented, public-credentialed) API, one results file per week. Doesn't
  need a picks file to already exist, and is safe to re-run weekly to pick up
  flex-schedule changes and refresh scores:
  ```bash
  pip install -r scripts/requirements.txt
  python scripts/fetch_nfl_schedule.py --season 2026            # weeks 1-18
  python scripts/fetch_nfl_schedule.py --season 2026 --weeks 3-5
  ```
  The API credentials it needs are public (the same ones nfl.com's own
  frontend uses) but are kept out of plaintext via
  [SOPS](https://github.com/getsops/sops) + [age](https://github.com/FiloSottile/age)
  in `scripts/nfl_api_secrets.enc.yaml` (recipient key in `.sops.yaml`), purely
  to keep automated secret scanners quiet. Decrypting requires the matching
  age private key (ask whoever set up the repo), or you can skip SOPS entirely
  by exporting `NFL_API_CLIENT_KEY`/`NFL_API_CLIENT_SECRET` yourself. See the
  script's module docstring for the full setup and terms-of-service caveat.
- **Publishing live scores** — `fetch_nfl_schedule.py --upload` writes each
  week to Azure Blob Storage (`<season>/week-<N>.json`) instead of local
  files, so the site can show scores without a commit. Use the Make targets
  (they wrap the script with the right flags and venv):

  | Command | What it does |
  | --- | --- |
  | `make venv` | one-time: `.venv` + `scripts/requirements.txt` (Azure SDK) |
  | `make publish-scores` | publish the active week to **dev** |
  | `make publish-scores ENV=prod` | same, to **prod** (always explicit) |
  | `make publish-scores GATE=1 [ENV=prod]` | what cron runs: skips the NFL API unless a game is live, within 10 min of kickoff, or the published copy is 12h stale |
  | `make publish-scores WEEKS=3 [ENV=prod]` | force one week (or `1-4`) regardless of gating |
  | `make backfill-scores [ENV=prod]` | one-time bootstrap: publish weeks 1-18 |
  | `make test-scripts` | unit tests for the gating logic |

  `WEEKS=active` (the default) is the earliest week not yet fully final. A
  game already published as `final` is never downgraded.

  **Setting up an environment (dev or prod) from scratch**
  1. Infra exists (storage account, `scores` container, uploader identity and
     role) — see `docs/uploading-scores.md` in `platform-foundation`.
  2. `make venv`, then export `PLATFORM_FOUNDATION_DIR=/path/to/platform-foundation`
     and make sure your age key is available (`SOPS_AGE_KEY_FILE`, or
     `~/.config/sops/age/keys.txt`).
  3. Bootstrap once: `make backfill-scores` (dev) and
     `make backfill-scores ENV=prod`. Without this, `WEEKS=active` walks
     forward one unpublished week per run.
  4. Verify: `curl -s https://<account>.blob.core.windows.net/scores/2026/week-3.json`
     (accounts: `solthothfbpicksdev`, `solthothfbpicksprod`), then schedule
     the gated command below.

  Auth is a per-environment service principal with a certificate that lives
  SOPS-encrypted in `platform-foundation`, decrypted in memory. Ids and cert
  filenames (edit `cert` to rotate) are in `scripts/upload_targets.yaml`;
  details in `scripts/score_publish.py`. Scheduling (dev and prod are separate
  jobs; cron's PATH is minimal, so set it explicitly):
  ```cron
  */5 * * * * cd /path/to/football-picks && PATH=/opt/homebrew/bin:/usr/bin:/bin SOPS_AGE_KEY_FILE=$HOME/.config/sops/age/keys.txt PLATFORM_FOUNDATION_DIR=/path/to/platform-foundation make publish-scores GATE=1 ENV=prod >> /tmp/scores-prod.log 2>&1
  ```
- [`scaffold_picks.py`](scripts/scaffold_picks.py) — writes a new week's
  picks-file scaffold from that week's schedule/results file: the `games`
  section pre-filled with that week's away/home teams, plus a `Sample`
  participant showing the picks format to duplicate once you know who's
  playing the pool that week:
  ```bash
  python scripts/scaffold_picks.py --season 2026 --week 3 --pot 180
  ```
  Or via the `Makefile`, which also fetches the week's schedule first:
  ```bash
  make scaffold-picks WEEK=3 POT=180              # SEASON defaults to the current year
  make scaffold-picks WEEK=3 POT=180 SEASON=2026 FORCE=1   # overwrite an existing picks file
  ```
  Refuses to overwrite an existing picks file unless `--force`/`FORCE=1` is given.

### Team logos

`src/assets/team-logos/*.svg` are the 32 teams' logos, downloaded from the
NFL's own static asset CDN (`static.www.nfl.com/.../league/api/clubs/logos/…`,
the same one `nfl.com/scores` itself loads) and keyed by the same team
nickname strings used in `data/*.yaml` (see `src/data/teamLogos.ts`). Team
names/logos are the teams' registered trademarks — fine to keep in a private,
non-commercial pool like this one, but don't repurpose them commercially.

## Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [pnpm](https://pnpm.io/) (this repo pins it via the `packageManager` field —
  run `corepack enable pnpm` if you don't have it)
- Python 3 — only needed to run the `scripts/` tooling (see
  [Scripts](#scripts)), not for the app itself

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
