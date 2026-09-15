#!/usr/bin/env python3
"""Renumber a picks file's games to match a schedule/results file's ordering.

Pool-sheet photos get transcribed in whatever order the physical sheet
happened to list games, which isn't reliable -- only the Sunday Night and
Monday Night games are consistently placed last (they're always the last
game(s) chronologically anyway, so this holds regardless of transcription
order). This script fixes the rest: it matches each picks-file game to its
real matchup in a schedule file (e.g. one from fetch_nfl_schedule.py) by
team names, then renumbers the picks file's games and every participant's
picks to use the schedule's own, consistent game_XX numbering -- so a picks
file and its results file always agree on what "game_07" means.

Usage:
    python scripts/remap_picks_to_schedule.py --picks data/nfl_pool_week-1_picks.yaml
    python scripts/remap_picks_to_schedule.py --picks data/nfl_pool_week-1_picks.yaml --dry-run

    By default, looks for data/nfl_pool_week-<week>_results-<season>.yaml
    (matching the picks file's own pool.season/pool.week) as the schedule
    source. Override with --schedule if it lives somewhere else.

This rewrites the picks file in place (re-serializing the whole file, so
expect some harmless cosmetic diffs like quoting/line-wrapping alongside the
real change). It's safe to re-run: if the picks file already matches the
schedule's numbering, nothing changes. It refuses to write anything if any
game can't be matched unambiguously -- better to fail loudly than silently
mis-map a game and corrupt scoring.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import yaml


def load_yaml(path: Path) -> dict[str, Any]:
    return yaml.safe_load(path.read_text())


def team_pair(entry: dict[str, Any]) -> frozenset[str]:
    return frozenset({entry["away"], entry["home"]})


def build_remap(picks_games: list[dict[str, Any]], schedule_games: dict[str, Any]) -> dict[str, str]:
    """Maps each picks-file game id to the schedule file's game id for the same matchup."""
    schedule_by_pair: dict[frozenset[str], str] = {}
    for game_id, entry in schedule_games.items():
        pair = team_pair(entry)
        if pair in schedule_by_pair:
            raise ValueError(f"schedule file has two games with the same matchup: {sorted(pair)}")
        schedule_by_pair[pair] = game_id

    remap: dict[str, str] = {}
    unmatched: list[str] = []
    for game in picks_games:
        match = schedule_by_pair.get(team_pair(game))
        if match is None:
            unmatched.append(f"{game['id']} ({game['away']} @ {game['home']})")
        else:
            remap[game["id"]] = match

    if unmatched:
        raise ValueError(
            "no schedule match found for: "
            + ", ".join(unmatched)
            + "\n(check team name spelling matches between the picks file and the schedule file)"
        )

    if len(set(remap.values())) != len(remap):
        raise ValueError("two picks-file games mapped to the same schedule game -- check for a duplicate matchup")

    if len(remap) != len(schedule_games):
        unused = sorted(set(schedule_games) - set(remap.values()))
        raise ValueError(f"picks file is missing games the schedule has: {unused}")

    return remap


def apply_remap(picks_data: dict[str, Any], schedule_games: dict[str, Any], remap: dict[str, str]) -> None:
    picks_data["games"] = [
        {"id": game_id, "away": entry["away"], "home": entry["home"]} for game_id, entry in sorted(schedule_games.items())
    ]

    for participant in picks_data["participants"]:
        new_picks = {remap[old_id]: team for old_id, team in participant["picks"].items()}
        participant["picks"] = dict(sorted(new_picks.items()))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--picks", type=Path, required=True, help="Path to the picks file to renumber")
    parser.add_argument("--schedule", type=Path, default=None, help="Schedule/results file to renumber against (default: inferred)")
    parser.add_argument("--dry-run", action="store_true", help="Show the mapping without writing changes")
    args = parser.parse_args()

    picks_data = load_yaml(args.picks)
    season = picks_data["pool"]["season"]
    week = picks_data["pool"]["week"]

    schedule_path = args.schedule or args.picks.parent / f"nfl_pool_week-{week}_results-{season}.yaml"
    if not schedule_path.exists():
        sys.exit(f"Schedule file not found: {schedule_path} (pass --schedule to point elsewhere)")

    schedule_data = load_yaml(schedule_path)
    schedule_games = {k: v for k, v in schedule_data.items() if k.startswith("game_")}

    try:
        remap = build_remap(picks_data["games"], schedule_games)
    except ValueError as exc:
        sys.exit(f"Could not build a safe remap: {exc}")

    changed = {old: new for old, new in remap.items() if old != new}
    if not changed:
        print(f"{args.picks} already matches {schedule_path}'s numbering -- nothing to do.")
        return

    print(f"Remapping {args.picks} to match {schedule_path}:")
    for old_id, new_id in sorted(remap.items()):
        marker = "(unchanged)" if old_id == new_id else f"-> {new_id}"
        print(f"  {old_id} {marker}")

    if args.dry_run:
        print("\n(dry run -- no changes written)")
        return

    apply_remap(picks_data, schedule_games, remap)
    args.picks.write_text(yaml.safe_dump(picks_data, sort_keys=False, default_flow_style=False, allow_unicode=True))
    print(f"\nWrote {args.picks}")


if __name__ == "__main__":
    main()
