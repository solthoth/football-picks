#!/usr/bin/env python3
"""Fetch the NFL regular-season schedule (plus any live/final scores)
directly from NFL.com's own API and write one YAML file per week.

Unlike the AI Studio prompt workflow (scripts/gemini_ai_studio_prompt.md),
this doesn't need a picks file to already exist: it writes a self-contained
schedule for every requested week, including away/home team names. Run it
weekly to pick up schedule changes (NFL flex-schedules some games) and to
refresh scores as games are played.

CAVEAT -- this calls an undocumented, internal NFL.com API (the same one
nfl.com's own website calls from your browser, found by inspecting its
network traffic), using the public, unauthenticated web-client credentials
embedded in nfl.com's frontend bundle. It's not a login and not a paid API,
but it's also not an officially supported integration: NFL could change the
endpoint, rotate those credentials, or rate-limit it at any time without
notice, and automated use of it may not be covered by nfl.com's terms of
service. Fine for a personal, low-volume, run-it-yourself-once-a-week script;
don't build anything load-bearing or public on top of it.

Those credentials are public (anyone's browser sends the same ones), but to
keep automated secret scanners quiet they're kept out of plaintext here and
encrypted at rest with SOPS + age, in scripts/nfl_api_secrets.enc.yaml.

Setup:
    pip install -r scripts/requirements.txt

    # One-time: install sops and age (macOS: brew install sops age).
    # You need the *private* half of the age key scripts/nfl_api_secrets.enc.yaml
    # was encrypted for. Point sops at it one of these ways:
    #   export SOPS_AGE_KEY_FILE=/path/to/your/age-key.txt
    #   export SOPS_AGE_KEY="AGE-SECRET-KEY-1..."   # the key itself, not a path
    # sops also checks ~/.config/sops/age/keys.txt by default, so if your key
    # already lives there you don't need to set anything.
    #
    # Don't have this repo's age key? You're not the right person to decrypt
    # it -- ask whoever set it up (see .sops.yaml for the recipient public key).

    # No sops/age at all? Skip the encrypted file entirely by exporting the
    # credentials directly (get them from whoever holds the decryption key):
    #   export NFL_API_CLIENT_KEY=...
    #   export NFL_API_CLIENT_SECRET=...

Usage:
    python scripts/fetch_nfl_schedule.py --season 2026
    python scripts/fetch_nfl_schedule.py --season 2026 --weeks 2
    python scripts/fetch_nfl_schedule.py --season 2026 --weeks 1-4

Output:
    Writes data/nfl_pool_week-<N>_results-<season>.yaml for each requested
    week, overwriting it in place on every run (no per-run timestamp -- the
    intent is to re-run this weekly and have it refresh the same files).

    Games are keyed by "<away>@<home>" (e.g. "Falcons@Packers"), ordered by
    kickoff time. That id is stable across flex scheduling and identical in
    picks files, so results merge into any pool by matchup.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import uuid
from pathlib import Path
from typing import Any

import requests
import yaml

TOKEN_URL = "https://api.nfl.com/identity/v3/token"
SCHEDULE_URL = "https://api.nfl.com/football/v2/experience/weekly-game-details"
SECRETS_PATH = Path(__file__).parent / "nfl_api_secrets.enc.yaml"
DEVICE_INFO = "eyJtb2RlbCI6ImRlc2t0b3AiLCJvc05hbWUiOiJtYWNPUyIsIm9zVmVyc2lvbiI6IjEwLjE1LjciLCJ2ZXJzaW9uIjoiQ2hyb21lIEhlYWRsZXNzIn0="


def load_credentials() -> tuple[str, str]:
    """Client key/secret, from env vars if set, otherwise decrypted via sops.

    See the module docstring's Setup section for how to point sops at your
    age private key.
    """
    env_key, env_secret = "NFL_API_CLIENT_KEY", "NFL_API_CLIENT_SECRET"
    if os.environ.get(env_key) and os.environ.get(env_secret):
        return os.environ[env_key], os.environ[env_secret]

    if not shutil.which("sops"):
        sys.exit(
            "sops isn't installed (brew install sops age), and "
            f"{env_key}/{env_secret} aren't set. See this script's Setup docstring."
        )

    try:
        result = subprocess.run(
            ["sops", "--decrypt", "--output-type", "json", str(SECRETS_PATH)],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as exc:
        sys.exit(
            f"Failed to decrypt {SECRETS_PATH} with sops (do you have the age "
            f"private key it's encrypted for? see .sops.yaml):\n{exc.stderr}"
        )

    secrets = json.loads(result.stdout)["nfl_api"]
    return secrets["client_key"], secrets["client_secret"]


def get_access_token(client_key: str, client_secret: str) -> str:
    response = requests.post(
        TOKEN_URL,
        json={
            "clientKey": client_key,
            "clientSecret": client_secret,
            "deviceId": str(uuid.uuid4()),
            "deviceInfo": DEVICE_INFO,
            "networkType": "other",
        },
        timeout=15,
    )
    response.raise_for_status()
    return response.json()["accessToken"]


def nickname(full_team_name: str) -> str:
    """Every NFL team's nickname is the last word of its full name (e.g.
    "Seattle Seahawks" -> "Seahawks"), matching how picks files name teams."""
    return full_team_name.split()[-1]


def fetch_week_games(token: str, season: int, week: int) -> list[dict[str, Any]]:
    response = requests.get(
        SCHEDULE_URL,
        params={
            "includeDriveChart": "false",
            "includeReplays": "false",
            "includeStandings": "false",
            "includeTaggedVideos": "false",
            "season": season,
            "type": "REG",
            "week": week,
        },
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        timeout=15,
    )
    response.raise_for_status()
    body = response.json()
    # The API returns a plain JSON array of games.
    return body if isinstance(body, list) else list(body.values())


def game_status_and_score(game: dict[str, Any]) -> tuple[str, int | None, int | None, str | None]:
    summary = game.get("summary")
    if not summary:
        return "scheduled", None, None, None

    away_total = summary["awayTeam"]["score"]["total"]
    home_total = summary["homeTeam"]["score"]["total"]

    # Overtime games report phase "FINAL_OVERTIME" rather than plain "FINAL".
    if not (summary.get("phase") or "").startswith("FINAL"):
        return "in_progress", away_total, home_total, None

    if away_total > home_total:
        winner = nickname(game["awayTeam"]["fullName"])
    elif home_total > away_total:
        winner = nickname(game["homeTeam"]["fullName"])
    else:
        winner = None
    return "final", away_total, home_total, winner


def build_week_output(season: int, week: int, games: list[dict[str, Any]]) -> dict[str, Any]:
    # Late-season games sometimes have no kickoff time yet (date/time TBD
    # pending flex scheduling); sort those last rather than crashing.
    games_sorted = sorted(games, key=lambda g: g["time"] or "9999")
    results: dict[str, Any] = {}

    for game in games_sorted:
        status, away_score, home_score, winner = game_status_and_score(game)
        away, home = nickname(game["awayTeam"]["fullName"]), nickname(game["homeTeam"]["fullName"])
        results[f"{away}@{home}"] = {
            "away": away,
            "home": home,
            "kickoff_time": game["time"],
            "status": status,
            "away_score": away_score,
            "home_score": home_score,
            "winner": winner,
        }
    return {"pool": {"season": season, "week": week}, "games": results}


def parse_week_range(value: str) -> list[int]:
    if "-" in value:
        start, end = value.split("-", 1)
        return list(range(int(start), int(end) + 1))
    return [int(week) for week in value.split(",")]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--season", type=int, required=True, help="Season year, e.g. 2026")
    parser.add_argument("--weeks", default="1-18", help='Week or range, e.g. "1-18" (default), "8", or "3,4,5"')
    parser.add_argument("--out-dir", type=Path, default=Path("data"), help="Directory to write results files into")
    args = parser.parse_args()

    weeks = parse_week_range(args.weeks)
    args.out_dir.mkdir(parents=True, exist_ok=True)

    client_key, client_secret = load_credentials()

    try:
        token = get_access_token(client_key, client_secret)
    except requests.RequestException as exc:
        sys.exit(f"Failed to authenticate with NFL.com's API: {exc}")

    for week in weeks:
        try:
            games = fetch_week_games(token, args.season, week)
        except requests.RequestException as exc:
            print(f"warning: failed to fetch week {week}: {exc}", file=sys.stderr)
            continue

        if not games:
            print(f"warning: no games returned for week {week}, skipping", file=sys.stderr)
            continue

        output = build_week_output(args.season, week, games)
        out_path = args.out_dir / f"nfl_pool_week-{week}_results-{args.season}.yaml"
        out_path.write_text(yaml.safe_dump(output, sort_keys=False, default_flow_style=False))
        print(f"Wrote {out_path} ({len(games)} games)")

        time.sleep(0.3)


if __name__ == "__main__":
    main()
