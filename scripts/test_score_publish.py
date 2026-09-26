"""Unit tests for score_publish's pure decision logic.

Run from the repo root:  python -m unittest discover -s scripts -p "test_*.py"
"""

import unittest
from datetime import datetime, timedelta, timezone

import score_publish as sp

NOW = datetime(2026, 9, 27, 18, 0, tzinfo=timezone.utc)


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def game(status: str, kickoff: datetime | None) -> dict:
    return {
        "away": "A",
        "home": "B",
        "kickoff_time": iso(kickoff) if kickoff else None,
        "status": status,
        "away_score": None,
        "home_score": None,
        "winner": None,
    }


def published(games: dict, updated_at: datetime = NOW - timedelta(minutes=5)) -> dict:
    return {"season": 2026, "week": 3, "updated_at": iso(updated_at), "games": games}


class ShouldRun(unittest.TestCase):
    def test_nothing_published_yet(self):
        self.assertTrue(sp.should_run(None, NOW))

    def test_all_final_stops_even_when_stale(self):
        stale = NOW - timedelta(days=3)
        p = published({"a@b": game("final", NOW - timedelta(days=4))}, updated_at=stale)
        self.assertFalse(sp.should_run(p, NOW))

    def test_in_progress_runs(self):
        p = published({"a@b": game("in_progress", NOW - timedelta(hours=1))})
        self.assertTrue(sp.should_run(p, NOW))

    def test_kickoff_soon_runs(self):
        p = published({"a@b": game("scheduled", NOW + timedelta(minutes=8))})
        self.assertTrue(sp.should_run(p, NOW))

    def test_kickoff_far_away_skips(self):
        p = published({"a@b": game("scheduled", NOW + timedelta(hours=3))})
        self.assertFalse(sp.should_run(p, NOW))

    def test_kicked_off_but_not_final_runs(self):
        p = published({"a@b": game("scheduled", NOW - timedelta(minutes=30))})
        self.assertTrue(sp.should_run(p, NOW))

    def test_unknown_kickoff_skips_until_stale(self):
        p = published({"a@b": game("scheduled", None)})
        self.assertFalse(sp.should_run(p, NOW))

    def test_stale_unfinished_week_refreshes(self):
        p = published({"a@b": game("scheduled", NOW + timedelta(days=2))}, updated_at=NOW - timedelta(hours=13))
        self.assertTrue(sp.should_run(p, NOW))

    def test_final_games_alongside_upcoming_ones_dont_trigger(self):
        p = published(
            {
                "a@b": game("final", NOW - timedelta(days=2)),
                "c@d": game("scheduled", NOW + timedelta(days=2)),
            }
        )
        self.assertFalse(sp.should_run(p, NOW))


class MergeWithoutRegressing(unittest.TestCase):
    def test_final_stays_final(self):
        old = published({"a@b": game("final", NOW)})
        new = {"a@b": game("in_progress", NOW)}
        self.assertEqual(sp.merge_without_regressing(new, old)["a@b"]["status"], "final")

    def test_progress_is_accepted(self):
        old = published({"a@b": game("scheduled", NOW)})
        new = {"a@b": game("in_progress", NOW)}
        self.assertEqual(sp.merge_without_regressing(new, old)["a@b"]["status"], "in_progress")

    def test_no_published_returns_new(self):
        new = {"a@b": game("scheduled", NOW)}
        self.assertEqual(sp.merge_without_regressing(new, None), new)

    def test_games_missing_from_new_are_not_resurrected(self):
        old = published({"a@b": game("final", NOW)})
        self.assertEqual(sp.merge_without_regressing({}, old), {})


class NeedsUpload(unittest.TestCase):
    def test_changed_games(self):
        old = published({"a@b": game("scheduled", NOW)})
        self.assertTrue(sp.needs_upload({"a@b": game("in_progress", NOW)}, old, NOW))

    def test_unchanged_and_fresh(self):
        games = {"a@b": game("scheduled", NOW)}
        self.assertFalse(sp.needs_upload(games, published(games), NOW))

    def test_unchanged_but_stale(self):
        games = {"a@b": game("scheduled", NOW)}
        self.assertTrue(sp.needs_upload(games, published(games, NOW - timedelta(hours=13)), NOW))

    def test_nothing_published(self):
        self.assertTrue(sp.needs_upload({"a@b": game("scheduled", NOW)}, None, NOW))


if __name__ == "__main__":
    unittest.main()
