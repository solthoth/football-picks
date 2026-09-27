"""Unit tests for fetch_nfl_schedule's pure decision logic.

Run from the repo root:  python -m unittest discover -s scripts -p "test_*.py"
"""

import unittest
from datetime import datetime, timedelta, timezone

import fetch_nfl_schedule as fns

NOW = datetime(2026, 9, 27, 12, 0, tzinfo=timezone.utc)


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def api_game(phase: str, away_score: int, home_score: int, kickoff: datetime) -> dict:
    return {
        "time": iso(kickoff),
        "awayTeam": {"fullName": "Las Vegas Raiders"},
        "homeTeam": {"fullName": "New Orleans Saints"},
        "summary": {
            "phase": phase,
            "awayTeam": {"score": {"total": away_score}},
            "homeTeam": {"score": {"total": home_score}},
        },
    }


class GameStatusAndScore(unittest.TestCase):
    def test_no_summary_is_scheduled(self):
        game = {"time": iso(NOW + timedelta(hours=1)), "awayTeam": {}, "homeTeam": {}}
        self.assertEqual(fns.game_status_and_score(game, now=NOW), ("scheduled", None, None, None))

    def test_pregame_summary_before_kickoff_is_scheduled(self):
        # Regression: the API can attach a 0-0 summary with an empty/pregame
        # phase well before kickoff; that alone must not read as in-progress.
        game = api_game(phase="", away_score=0, home_score=0, kickoff=NOW + timedelta(hours=1, minutes=25))
        self.assertEqual(fns.game_status_and_score(game, now=NOW), ("scheduled", None, None, None))

    def test_non_final_phase_after_kickoff_is_in_progress(self):
        game = api_game(phase="", away_score=3, home_score=0, kickoff=NOW - timedelta(minutes=10))
        self.assertEqual(fns.game_status_and_score(game, now=NOW), ("in_progress", 3, 0, None))

    def test_final_phase_picks_winner(self):
        game = api_game(phase="FINAL", away_score=24, home_score=17, kickoff=NOW - timedelta(hours=3))
        self.assertEqual(fns.game_status_and_score(game, now=NOW), ("final", 24, 17, "Raiders"))

    def test_final_overtime_phase_is_final(self):
        game = api_game(phase="FINAL_OVERTIME", away_score=20, home_score=23, kickoff=NOW - timedelta(hours=3))
        self.assertEqual(fns.game_status_and_score(game, now=NOW), ("final", 20, 23, "Saints"))

    def test_final_tie_has_no_winner(self):
        game = api_game(phase="FINAL", away_score=17, home_score=17, kickoff=NOW - timedelta(hours=3))
        self.assertEqual(fns.game_status_and_score(game, now=NOW), ("final", 17, 17, None))


if __name__ == "__main__":
    unittest.main()
