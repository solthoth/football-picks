#!/usr/bin/env python3
"""Generate an empty picks-file scaffold for a week, from that week's schedule.

Reads a schedule/results file (e.g. one written by fetch_nfl_schedule.py) and
writes a picks file with the games section pre-filled from it and a single
"Sample" participant demonstrating the expected picks format -- ready for you
to duplicate, once you know who's playing the pool that week, once per real
participant with their actual picks.

Usage:
    python scripts/scaffold_picks.py --season 2026 --week 3 --pot 180

    By default, reads data/nfl_pool_week-<week>_results-<season>.yaml (the
    file fetch_nfl_schedule.py writes) and writes
    data/nfl_pool_week-<week>_picks.yaml. Override either with --schedule /
    --out. Refuses to overwrite an existing picks file unless --force is given.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import yaml


def load_yaml(path: Path) -> dict[str, Any]:
    return yaml.safe_load(path.read_text())


def build_scaffold(season: int, week: int, pot: int, schedule_data: dict[str, Any]) -> dict[str, Any]:
    schedule_games = schedule_data.get("games")
    if not schedule_games:
        raise ValueError("schedule file has no games")

    games = [{"id": game_id, "away": entry["away"], "home": entry["home"]} for game_id, entry in schedule_games.items()]

    # Home team by default just to give the "Sample" participant syntactically
    # valid, non-blank picks to copy the shape of -- not a prediction.
    sample_picks = {game["id"]: game["home"] for game in games}

    return {
        "pool": {"season": season, "week": week, "pot": pot},
        "games": games,
        "participants": [
            {
                "name": "Sample",
                "picks": sample_picks,
                "tie_breaker_total_score": 40,
            }
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--season", type=int, required=True, help="Season year, e.g. 2026")
    parser.add_argument("--week", type=int, required=True, help="Week number, e.g. 3")
    parser.add_argument("--pot", type=int, required=True, help="Total pot for the week")
    parser.add_argument(
        "--schedule",
        type=Path,
        default=None,
        help="Schedule/results file to scaffold from (default: data/nfl_pool_week-<week>_results-<season>.yaml)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Picks file to write (default: data/nfl_pool_week-<week>_picks.yaml)",
    )
    parser.add_argument("--force", action="store_true", help="Overwrite an existing picks file")
    args = parser.parse_args()

    schedule_path = args.schedule or Path("data") / f"nfl_pool_week-{args.week}_results-{args.season}.yaml"
    if not schedule_path.exists():
        sys.exit(
            f"Schedule file not found: {schedule_path}\n"
            "Fetch it first, e.g.:\n"
            f"  python scripts/fetch_nfl_schedule.py --season {args.season} --weeks {args.week}\n"
            "(or pass --schedule to point elsewhere)"
        )

    out_path = args.out or Path("data") / f"nfl_pool_week-{args.week}_picks.yaml"
    if out_path.exists() and not args.force:
        sys.exit(f"{out_path} already exists -- pass --force to overwrite")

    schedule_data = load_yaml(schedule_path)
    try:
        scaffold = build_scaffold(args.season, args.week, args.pot, schedule_data)
    except ValueError as exc:
        sys.exit(f"Could not build scaffold from {schedule_path}: {exc}")

    out_path.write_text(yaml.safe_dump(scaffold, sort_keys=False, default_flow_style=False, allow_unicode=True))
    print(f"Wrote {out_path} ({len(scaffold['games'])} games) from {schedule_path}")
    print('Next: duplicate the "Sample" participant once per person in the pool and fill in their real picks.')


if __name__ == "__main__":
    main()
