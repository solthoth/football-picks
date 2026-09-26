# NFL Week Results Prompt (for Gemini in AI Studio)

Manual replacement for `scripts/fetch_week_results.py` — use this when you'd
rather paste into [aistudio.google.com](https://aistudio.google.com) than run
the API script. Same output schema either way, so results stay compatible
with merging into the front-end by game id (`away@home`, e.g. `Falcons@Packers`).

## Before you paste this

1. Open a new chat in Google AI Studio.
2. Turn on **Grounding with Google Search** in the tools panel (left side, or
   under "Tools") — without it, Gemini will guess from training data instead
   of looking up real scores.
3. Fill in the three placeholders below: `[WEEK_LABEL]`, `[SEASON]`, `[TODAY]`.
4. Paste the whole prompt below, followed by the full contents of your
   `nfl_pool_extracted-*.yaml` file (just open it and copy everything).

## The prompt

```
You are a sports data lookup assistant. Use Google Search to find the current
status and score of each NFL game listed in the `games:` section of the YAML
pasted below, for [WEEK_LABEL] (season [SEASON]). Today's date is [TODAY].
Search reliable sources (nfl.com, espn.com) and prefer the most recently
updated information.

Respond with ONLY a single YAML code block and nothing else (no prose before
or after). Use exactly this structure, one entry per game `id` from the input,
in the same order:

```yaml
"Falcons@Packers":
  kickoff_time: <ISO 8601 UTC datetime, e.g. "2026-09-14T17:00:00Z", or null if unknown>
  status: <"scheduled" | "in_progress" | "final">
  away_score: <integer or null if the game has not started>
  home_score: <integer or null if the game has not started>
  winner: <team name, or null if not final or if tied>
```

Rules:
- kickoff_time is the scheduled (or actual) start time of the game, converted
  to UTC, formatted as ISO 8601 ending in "Z". Include it even for games that
  have already started or finished.
- status must be exactly one of: scheduled, in_progress, final.
- Use null (not 0) for scores when status is "scheduled".
- winner must be null unless status is "final" and the game was not a tie.
- winner, when set, must exactly match the "away" or "home" name given below.
- Do not invent scores or times. If you cannot find a game, still include it
  with status "scheduled", null scores, and null kickoff_time.

Here is the picks file:

<PASTE THE FULL CONTENTS OF nfl_pool_extracted-*.yaml HERE>
```

## What to do with Gemini's reply

Copy the YAML code block it returns and wrap it like this, then save as
`data/nfl_pool_results-<same date suffix as your picks file>.yaml`:

```yaml
results:
  source: gemini
  model: <model shown in AI Studio, e.g. gemini-3.6-flash>
  week_reference: nfl_pool_extracted-<date>.yaml
  season: <season>
  fetched_at: <current UTC timestamp, e.g. "2026-09-14T02:15:00Z">
games:
  <paste Gemini's per-game block here, indented one level>
```

## Re-running later in the week

Come back to the same chat (context makes it faster) or start fresh, update
`[TODAY]`, and repeat the prompt. Gemini will report which games are now
`in_progress`/`final`. Keep the `kickoff_time` values from your first run
instead of overwriting them — they don't change, and asking again risks a
slightly reformatted or missing value.

## Sanity checks before you save the output

Gemini's chat replies aren't validated the way the script would have
validated them, so skim for these before saving:

- Every game `id` from the picks file is present, in the same count.
- No unrecognized game ids were invented.
- Every `status` is exactly `scheduled`, `in_progress`, or `final` (nothing
  else, no typos like `"in progress"` or `"Final"`).
- Every non-null `winner` exactly matches an `away`/`home` team name from the
  picks file — not an abbreviation, city-only name, or nickname variant.
- Scores are `null` (not `0`) for any game still `scheduled`.
