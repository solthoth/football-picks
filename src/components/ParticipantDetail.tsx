import type { GameStatus, Pool } from '../data/types'
import { getPickOutcomes, summarizeOutcomes } from '../domain/standings'
import { determineWeekWinner } from '../domain/weekWinner'
import { CheckIcon, ChevronLeftIcon, ClockIcon, XIcon } from './icons'
import { WinnerBadge } from './WinnerBadge'

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

function OutcomeIcon({ correct }: { correct: boolean | null }) {
  if (correct === true) return <CheckIcon />
  if (correct === false) return <XIcon />
  return <ClockIcon />
}

export function ParticipantDetail({ pool, participantName, onBack }: ParticipantDetailProps) {
  const participant = pool.participants.find((p) => p.name === participantName)

  if (!participant) {
    return (
      <main className="participant-detail">
        <button type="button" className="back-link" onClick={onBack}>
          <ChevronLeftIcon />
          Back
        </button>
        <p>Couldn't find {participantName} in this week's pool.</p>
      </main>
    )
  }

  const outcomes = getPickOutcomes(pool, participant)
  const summary = summarizeOutcomes(participant.name, outcomes)
  const { winnerName } = determineWeekWinner(pool)

  return (
    <main className="participant-detail">
      <button type="button" className="back-link" onClick={onBack}>
        <ChevronLeftIcon />
        Back to participants
      </button>

      <div className="detail-heading">
        <h1>{participant.name}</h1>
        {participant.name === winnerName && <WinnerBadge />}
      </div>
      <p>
        Season {pool.season} &middot; Week {pool.week}
      </p>

      <div className="stat-row" role="group" aria-label="Pick summary">
        <span className="stat-pill stat-pill--success">
          <CheckIcon />
          {summary.correct} Correct
        </span>
        <span className="stat-pill stat-pill--danger">
          <XIcon />
          {summary.incorrect} Incorrect
        </span>
        <span className="stat-pill stat-pill--pending">
          <ClockIcon />
          {summary.pending} Pending
        </span>
      </div>
      <p className="summary-note">out of {summary.totalGames} games</p>

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
                <td data-label="Matchup">
                  {outcome.away} @ {outcome.home}
                </td>
                <td data-label="Pick">
                  <span>{outcome.pickedTeam ?? '—'}</span>
                </td>
                <td data-label="Result">
                  <span>{statusLabel(outcome.status, result?.awayScore ?? null, result?.homeScore ?? null)}</span>
                </td>
                <td data-label="Outcome">
                  <span className="outcome-value">
                    <OutcomeIcon correct={outcome.correct} />
                    {correctLabel(outcome.correct)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </main>
  )
}
