"""Publish weekly score JSON to Azure Blob Storage, and decide when to.

Used by fetch_nfl_schedule.py's --upload/--gate flags. Kept separate so the
decision logic (should_run, merge_without_regressing, ...) is pure and unit
tested (scripts/test_score_publish.py).

Auth: each environment has its own service principal that authenticates with
a certificate and can only write to that environment's `scores` container.
The certificate lives SOPS-encrypted in the platform-foundation repo
(docs/uploading-scores.md there). It is decrypted in memory and handed
straight to the Azure SDK -- the plaintext key never touches disk.

Setup:
    pip install -r scripts/requirements.txt
    export PLATFORM_FOUNDATION_DIR=/path/to/platform-foundation
    # sops needs your age private key: SOPS_AGE_KEY_FILE, or the default
    # ~/.config/sops/age/keys.txt.

Per-environment ids/account/cert names are in scripts/upload_targets.yaml.
Rotating the certificate = point that file's `cert` at the new .pfx.sops.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import yaml

TARGETS_PATH = Path(__file__).parent / "upload_targets.yaml"
CERTS_SUBDIR = Path("stacks/azure/tenant/certs")
CACHE_CONTROL = "public, max-age=30"

# Start polling this long before the first kickoff of a game that isn't final.
KICKOFF_LEAD = timedelta(minutes=10)
# Republish an otherwise-unchanged week after this long, so schedule changes
# (flex scheduling) get picked up while nothing is live.
REFRESH_AFTER = timedelta(hours=12)


def load_target(env: str) -> dict[str, str]:
    targets = yaml.safe_load(TARGETS_PATH.read_text())
    if env not in targets:
        sys.exit(f"Unknown --env {env!r}; expected one of: {', '.join(targets)}")
    return targets[env]


def blob_name(season: int, week: int) -> str:
    return f"{season}/week-{week}.json"


def public_url(target: dict[str, str], season: int, week: int) -> str:
    return f"https://{target['storage_account']}.blob.core.windows.net/{target['container']}/{blob_name(season, week)}"


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def is_complete(payload: dict[str, Any]) -> bool:
    games = payload.get("games") or {}
    return bool(games) and all(g.get("status") == "final" for g in games.values())


def should_run(published: dict[str, Any] | None, now: datetime) -> bool:
    """Whether a gated run needs to hit the NFL API for this week.

    Nothing published yet -> yes. Every game final -> no (week is done).
    Otherwise yes when a game is in progress, or a not-final game has kicked
    off or kicks off within KICKOFF_LEAD, or the published data is stale.
    """
    if published is None:
        return True
    if is_complete(published):
        return False

    updated_at = parse_time(published.get("updated_at"))
    if updated_at is None or now - updated_at > REFRESH_AFTER:
        return True

    for game in published["games"].values():
        if game.get("status") == "final":
            continue
        if game.get("status") == "in_progress":
            return True
        kickoff = parse_time(game.get("kickoff_time"))
        if kickoff is not None and kickoff - KICKOFF_LEAD <= now:
            return True
    return False


def merge_without_regressing(new_games: dict[str, Any], published: dict[str, Any] | None) -> dict[str, Any]:
    """A game already published as final stays final, even if a later fetch
    (glitchy or partial API response) reports it as anything else."""
    if published is None:
        return new_games
    merged = dict(new_games)
    for game_id, old in (published.get("games") or {}).items():
        if old.get("status") == "final" and game_id in merged and merged[game_id].get("status") != "final":
            merged[game_id] = old
    return merged


def needs_upload(new_games: dict[str, Any], published: dict[str, Any] | None, now: datetime) -> bool:
    """Upload when the games changed, or the published copy is stale."""
    if published is None or published.get("games") != new_games:
        return True
    updated_at = parse_time(published.get("updated_at"))
    return updated_at is None or now - updated_at > REFRESH_AFTER


def build_payload(season: int, week: int, games: dict[str, Any], now: datetime) -> dict[str, Any]:
    return {
        "season": season,
        "week": week,
        "updated_at": now.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "games": games,
    }


def fetch_published(target: dict[str, str], season: int, week: int) -> dict[str, Any] | None:
    """Anonymously reads what's currently published (same URL the site uses).
    None when nothing is published yet or it can't be read -- callers then
    behave as if nothing is published."""
    request = urllib.request.Request(public_url(target, season, week), headers={"Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            print(f"warning: reading published week {week} failed: {exc}", file=sys.stderr)
        return None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"warning: reading published week {week} failed: {exc}", file=sys.stderr)
        return None


def find_active_week(target: dict[str, str], season: int, weeks: range = range(1, 19)) -> int | None:
    """Earliest week whose published data is missing or not fully final."""
    for week in weeks:
        published = fetch_published(target, season, week)
        if published is None or not is_complete(published):
            return week
    return None


def _decrypt_certificate(target: dict[str, str]) -> bytes:
    root = os.environ.get("PLATFORM_FOUNDATION_DIR")
    if not root:
        sys.exit("PLATFORM_FOUNDATION_DIR isn't set (path to the platform-foundation checkout). See score_publish.py.")
    cert_path = Path(root).expanduser() / CERTS_SUBDIR / target["cert"]
    if not cert_path.exists():
        sys.exit(f"Certificate not found: {cert_path}")
    try:
        return subprocess.run(
            ["sops", "-d", "--input-type", "binary", "--output-type", "binary", str(cert_path)],
            check=True,
            capture_output=True,
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        detail = exc.stderr.decode() if isinstance(exc, subprocess.CalledProcessError) else str(exc)
        sys.exit(f"Failed to decrypt {cert_path} with sops (age key available?):\n{detail}")


def upload(target: dict[str, str], season: int, week: int, payload: dict[str, Any]) -> str:
    # Imported here so the rest of the module (and its tests) works without
    # the Azure SDK installed.
    from azure.identity import CertificateCredential
    from azure.storage.blob import BlobServiceClient, ContentSettings

    credential = CertificateCredential(
        tenant_id=target["tenant_id"],
        client_id=target["client_id"],
        certificate_data=_decrypt_certificate(target),
    )
    service = BlobServiceClient(f"https://{target['storage_account']}.blob.core.windows.net", credential=credential)
    service.get_blob_client(target["container"], blob_name(season, week)).upload_blob(
        json.dumps(payload, indent=2).encode(),
        overwrite=True,
        content_settings=ContentSettings(content_type="application/json", cache_control=CACHE_CONTROL),
    )
    return public_url(target, season, week)
