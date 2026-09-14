import type { GameStatus, Pool } from '../data/types'
import { getPickOutcomes, summarizeOutcomes } from '../domain/standings'

interface ParticipantDetailProps {
  pool: Pool
  participantName: string
  onBack: () => void
}

function statusLabel(status: GameStatus | 'unknown', awayScore: number | null, homeScore: number | null): string {
  switch (status) {
    case 'final':
      return `Final ${awayScore ?? '?'}-${homeScore ?? '?'}`
    case 'in_progress':
      return `In progress ${awayScore ?? '?'}-${homeScore ?? '?'}`
    case 'scheduled':
      return 'Not started'
    case 'unknown':
      return 'No result yet'
  }
}

function correctLabel(correct: boolean | null): string {
  if (correct === true) return 'Correct'
  if (correct === false) return 'Incorrect'
  return 'Pending'
}

export function ParticipantDetail({ pool, participantName, onBack }: ParticipantDetailProps) {
  const participant = pool.participants.find((p) => p.name === participantName)

  if (!participant) {
    return (
      <main className="participant-detail">
        <button type="button" onClick={onBack}>
          &larr; Back
        </button>
        <p>Couldn't find {participantName} in this week's pool.</p>
      </main>
    )
  }

  const outcomes = getPickOutcomes(pool, participant)
  const summary = summarizeOutcomes(participant.name, outcomes)

  return (
    <main className="participant-detail">
      <button type="button" onClick={onBack}>
        &larr; Back to participants
      </button>

      <h1>{participant.name}</h1>
      <p>
        Season {pool.season} &middot; Week {pool.week}
      </p>
      <p className="summary">
        {summary.correct} correct, {summary.incorrect} incorrect, {summary.pending} pending out of{' '}
        {summary.totalGames} games
      </p>
      {participant.tieBreakerTotalScore !== null && (
        <p className="tie-breaker">Tiebreaker guess (combined score): {participant.tieBreakerTotalScore}</p>
      )}

      <table>
        <thead>
          <tr>
            <th>Matchup</th>
            <th>Pick</th>
            <th>Result</th>
            <th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {outcomes.map((outcome) => {
            const result = pool.results[outcome.gameId]
            return (
              <tr key={outcome.gameId} data-outcome={outcome.correct === null ? 'pending' : outcome.correct}>
                <td>
                  {outcome.away} @ {outcome.home}
                </td>
                <td>{outcome.pickedTeam ?? '—'}</td>
                <td>{statusLabel(outcome.status, result?.awayScore ?? null, result?.homeScore ?? null)}</td>
                <td>{correctLabel(outcome.correct)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </main>
  )
}
