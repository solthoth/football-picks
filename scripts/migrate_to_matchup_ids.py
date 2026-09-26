#!/usr/bin/env python3
"""One-time migration: replace positional `game_XX` ids with `away@home` ids.

Picks files:   games[].id and every participant's picks keys are rewritten
               using that file's own games list (id -> "<away>@<home>").
Results files: the top-level game_XX blocks move under a `games:` mapping
               keyed by "<away>@<home>" (taken from each block's own
               away/home fields).

Each file is mapped from its own contents, so no cross-file numbering
agreement is assumed. Files already in the new shape are left alone, which
makes this safe to re-run. It refuses to write a file if any id can't be
mapped or two games would collapse onto the same matchup id.

Usage:
    python scripts/migrate_to_matchup_ids.py --dry-run
    python scripts/migrate_to_matchup_ids.py

This re-serializes each file it changes, so expect harmless cosmetic diffs
(quoting/ordering) alongside the real change. Delete this script once the
data has been migrated.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import yaml


def matchup_id(away: str, home: str) -> str:
    return f"{away}@{home}"


def is_picks(data: dict[str, Any]) -> bool:
    return isinstance(data.get("games"), list) and isinstance(data.get("participants"), list)


def is_legacy_results(data: dict[str, Any]) -> bool:
    return any(key.startswith("game_") for key in data)


def migrate_picks(data: dict[str, Any]) -> dict[str, Any] | None:
    games = data["games"]
    if not any(str(g["id"]).startswith("game_") for g in games):
        return None

    mapping: dict[str, str] = {}
    for game in games:
        new_id = matchup_id(game["away"], game["home"])
        if new_id in mapping.values():
            raise ValueError(f"duplicate matchup {new_id}")
        mapping[game["id"]] = new_id

    migrated = dict(data)
    migrated["games"] = [{**game, "id": mapping[game["id"]]} for game in games]
    participants = []
    for participant in data["participants"]:
        picks = {}
        for game_id, team in participant["picks"].items():
            if game_id not in mapping:
                raise ValueError(f"{participant['name']} picks unknown game id {game_id}")
            picks[mapping[game_id]] = team
        participants.append({**participant, "picks": picks})
    migrated["participants"] = participants
    return migrated


def migrate_results(data: dict[str, Any]) -> dict[str, Any] | None:
    if not is_legacy_results(data):
        return None

    games: dict[str, Any] = {}
    for key, block in data.items():
        if not key.startswith("game_"):
            continue
        new_id = matchup_id(block["away"], block["home"])
        if new_id in games:
            raise ValueError(f"duplicate matchup {new_id}")
        games[new_id] = block
    return {"pool": data["pool"], "games": games}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--dry-run", action="store_true", help="Report what would change without writing")
    args = parser.parse_args()

    failed = False
    for path in sorted(args.data_dir.glob("*.yaml")):
        data = yaml.safe_load(path.read_text())
        try:
            migrated = migrate_picks(data) if is_picks(data) else migrate_results(data)
        except (KeyError, ValueError) as exc:
            print(f"error: {path}: {exc!r}", file=sys.stderr)
            failed = True
            continue

        if migrated is None:
            print(f"skip    {path} (already migrated)")
            continue
        print(f"migrate {path}")
        if not args.dry_run:
            path.write_text(yaml.safe_dump(migrated, sort_keys=False, default_flow_style=False, allow_unicode=True))

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
