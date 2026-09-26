# Live scores plan

Goal: collect NFL scores on an interval and publish them so the portal shows
current scores **without a git commit per update**. Scope is scores only —
player picks stay in `data/*.yaml` and are still committed.

## Target architecture

```
laptop cron (every 5 min, self-gating)
  └─ scripts/fetch_nfl_schedule.py --upload
        └─ Azure Blob Storage: scores/<season>/week-<N>.json   (public read, short cache)
                                   ▲
Azure Static Web App (React) ──────┘  fetch() at runtime, fallback to bundled YAML
```

No Azure Function, no Key Vault. The NFL credentials keep using the existing
sops/age (or env var) flow on the laptop.

## Decisions

| Topic | Decision |
| --- | --- |
| Scheduler | One laptop cron every 5 min; the script gates itself (below). No per-game crons. |
| Storage | Blob container, anonymous blob-level read (allowed by policy), CORS for the SWA origin. |
| Reads | Site fetches the blob URL directly. No read API. |
| Game id | `away@home` (e.g. `Falcons@Packers`) replaces `game_XX`. Unique within a season/week. |
| Results scope | One results file per season/week, **shared by all pools**. Picks stay per pool. |
| Game `status` | **Stays a stored field** (`scheduled` / `in_progress` / `final`) written by the script, as today. A derived-label refactor is deliberately out of scope for now. |
| Fallback | If the fetch fails, use the results YAML bundled at build time. |

## Data shapes

Results JSON (published to the blob; the committed `data/*_results-*.yaml`
files move to the same shape so there is one parser):

```json
{
  "season": 2026,
  "week": 3,
  "updated_at": "2026-09-27T17:45:00Z",
  "games": {
    "Falcons@Packers": {
      "kickoff_time": "2026-09-25T00:15:00Z",
      "status": "final",
      "away_score": 35,
      "home_score": 14,
      "winner": "Falcons"
    }
  }
}
```

Picks YAML changes only in ids:

```yaml
games:
  - id: "Falcons@Packers"
    away: Falcons
    home: Packers
participants:
  - name: Sumo
    picks:
      "Falcons@Packers": Packers
```

## Phases

### 1. Migrate to `away@home` ids (pure refactor, no Azure)

- One-time migration script rewriting existing picks + results files
  (`game_XX` → `away@home`, using each file's own game list). Retire
  `scripts/remap_picks_to_schedule.py` afterwards.
- `src/data/buildPools.ts`: drop `GAME_ID_PATTERN`; results parsed from a
  `games:` map keyed by matchup id; picks parsing already treats ids as opaque
  strings.
- Verify `src/domain/weekWinner.ts` and `standings.ts` have no `game_` /
  numeric-order assumptions (they key by `game.id`; tiebreaker game is chosen
  by latest kickoff).
- Update tests and fixtures under `src/data`, `src/domain`, `src/components`.
- Done when: `pnpm lint`, `pnpm build`, `pnpm test` are green and the UI is
  unchanged on existing data.

### 2. Script: JSON output, gating, upload

Changes to `scripts/fetch_nfl_schedule.py`:

- Emit the new results shape (`games` map by matchup, `updated_at`), as both
  YAML (local/committed) and JSON (for upload).
- `--upload` flag: put `scores/<season>/week-<N>.json` to the container with
  `Cache-Control: public, max-age=30` and `Content-Type: application/json`.
  Upload only when the content changed (ignoring `updated_at`).
- Self-gating (`--gate`): exit 0 immediately unless
  - a game in the last-uploaded/local file is `in_progress`, or
  - a kickoff is within ~10 minutes, or
  - no file exists for the week (full fetch, e.g. first run on Tuesday).
  Also exit if every game is `final`.
- Safety: never overwrite good data with an API error/empty response, and
  never move a game backwards from `final`.
- Active week: `--weeks` accepts an explicit value; default to the earliest
  week that isn't fully final.
- Upload auth from env vars (see infra outputs); document in the script
  docstring and README's Scripts section.
- Cron entry (documented, not committed): `*/5 * * * *` running the script
  with `--gate --upload`. Laptop asleep = scores lag; `updated_at` makes it
  visible.

### 3. Infra (separate repo, OpenTofu)

Hand the prompt in the next section to the infra agent. Outputs needed back:
storage account name, container name, public blob base URL, and the writer
credential mechanism.

### 4. Site: runtime scores

- `src/data/pools.ts`: keep the bundled build-time pools as the initial state
  and fallback; fetch `<VITE_SCORES_BASE_URL>/<season>/week-<N>.json` for each
  pool at runtime and merge results by matchup id.
- Poll about every 60 s while any game is not `final`; stop when all are final.
- Show "Scores as of <updated_at>" and a stale hint if it is old.
- `VITE_SCORES_BASE_URL` provided at build time (SWA config / CI env).
- Tests: merge logic, fetch failure → fallback, polling stop condition.

### 5. Cleanup

- Update `CLAUDE.md` (Data and scripts section) and README Scripts section.
- Decide whether committed results YAML is still needed (seed/fallback) or
  can be generated once at build time.

## Risks

- **Undocumented NFL API**: unchanged risk from the script's docstring; a
  laptop run avoids datacenter-IP blocking. Keep the manual YAML path as
  a fallback.
- **Laptop availability**: missed cron windows delay scores. Acceptable for a
  pet project.
- **Public blobs**: data is scores only (public info), no PII.
- **Migration**: get step 1 right first; every later step depends on ids.

## Prompt for the infra agent (OpenTofu repo)

> Create the OpenTofu needed to host live NFL score data for the
> `football-picks` app (an Azure Static Web App that already exists — do
> **not** create or modify it). Follow this repo's existing conventions for
> naming, tagging, providers, variables, remote state and module layout; if a
> convention is unclear, look at how existing resources are done and match it.
>
> **Purpose.** A script on a developer laptop uploads small JSON files
> (`scores/<season>/week-<N>.json`, a few KB each, rewritten about every 5
> minutes during games). The Static Web App's browser code reads them
> directly over HTTPS. Data is public sports scores, no sensitive content.
>
> **Resources to create**
> 1. A Storage Account (StorageV2, Standard LRS, Hot tier, TLS 1.2 minimum,
>    HTTPS only) in the appropriate existing resource group. Anonymous blob
>    access must be enabled at the account level (our Azure policy allows it).
> 2. A blob container named `scores` with public access level `blob`
>    (anonymous read of individual blobs; no anonymous listing).
> 3. Blob service CORS: allowed origins = that environment's Static Web App
>    default hostname and custom domain(s), plus `http://localhost:5173` for
>    local dev in non-production environments only; allowed methods
>    `GET, HEAD, OPTIONS`; allowed headers `*`; exposed headers
>    `ETag, Last-Modified, Content-Type, Cache-Control`; max age 3600.
>
>    **Do not ask me for the origins — discover them.** There are multiple
>    environments, each with its own Static Web App, default hostname and
>    custom domain. Build the origin list per environment as follows:
>    - If this repo already manages or references the SWA (module, remote
>      state, or `data "azurerm_static_web_app"`), take
>      `default_host_name` from there and prefer that over the CLI.
>    - Otherwise discover with the Azure CLI (read-only; confirm `az account
>      show` is the right subscription first):
>      `az staticwebapp list --query "[?contains(name,'football-picks')].{name:name,rg:resourceGroup,host:defaultHostname}" -o table`
>      to find each environment's app, then
>      `az staticwebapp hostname list --name <app> --resource-group <rg> --query "[].name" -o tsv`
>      for its custom domain(s). (The default hostname is also in
>      `az staticwebapp show --name <app> --resource-group <rg> --query defaultHostname -o tsv`.)
>    - Prefix each hostname with `https://` to form origins. Show me the
>      discovered origins per environment in a table before using them.
>    - Preferred wiring: default hostname via a `data` source, so it can't
>      drift. Custom domains aren't exposed by the azurerm data source, so
>      pass them as a per-environment variable (`swa_custom_domains`, list of
>      strings, e.g. in each environment's `tfvars`) populated from the CLI
>      output above. If this repo has a way to reference the custom-domain
>      resources instead, use that. Don't hardcode anything in `.tf` files.
> 4. A write path for the laptop uploader, least privilege, scoped to the
>    `scores` container only (write/create/overwrite; no delete, no list of
>    other containers). Prefer a service principal (or app registration) with
>    the `Storage Blob Data Contributor` role assigned at the container
>    scope, with a client secret that has an expiry, over account keys. If
>    this repo already has a standard pattern for machine identities, use
>    that instead. Do not enable shared-key access solely for this unless
>    there is no alternative; if you go with a container SAS instead, tell me
>    the trade-offs (SAS lands in state, expiry/rotation).
> 5. No lifecycle policy needed; blob versioning and soft delete are optional
>    (soft delete of 7 days is fine if cheap and conventional here).
>
> **Outputs / variables**
> - Environments: follow this repo's existing environment pattern (one
>   storage account per environment, each with its own CORS origins, unless
>   the repo convention says otherwise; tell me if you think a shared account
>   is better).
> - Variables: `swa_custom_domains` (list of strings, per environment),
>   resource group / location and environment/name prefix per repo convention.
> - Outputs: storage account name, container name, the public base URL
>   (`https://<account>.blob.core.windows.net/scores`), and everything the
>   uploader needs to authenticate (tenant id, client id, and the secret as a
>   sensitive output or a documented retrieval step). Mark secrets
>   `sensitive = true`.
>
> **Out of scope.** No Function App, no Key Vault, no CDN, no changes to the
> Static Web App. Upload `Cache-Control` headers are set by the uploader, not
> by infra.
>
> **Deliverables.** The `.tf` files (or module), a short README section
> describing the resources, required variables, how to read the outputs, and
> how to rotate the writer secret. Run `tofu fmt` and `tofu validate`, and
> show me the `tofu plan` summary before anything is applied. Ask me if any
> of the resource-group, naming, or identity conventions can't be inferred
> from the repo.
