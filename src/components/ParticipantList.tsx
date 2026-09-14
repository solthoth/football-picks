import type { Pool } from '../data/types'
import { buildLeaderboard } from '../domain/standings'
import { ChevronLeftIcon } from './icons'

interface ParticipantListProps {
  pool: Pool
  onSelect: (participantName: string) => void
  onBack: () => void
}

function medalClass(rank: number): string {
  if (rank === 1) return 'rank-badge rank-badge--gold'
  if (rank === 2) return 'rank-badge rank-badge--silver'
  if (rank === 3) return 'rank-badge rank-badge--bronze'
  return 'rank-badge'
}

export function ParticipantList({ pool, onSelect, onBack }: ParticipantListProps) {
  const leaderboard = buildLeaderboard(pool)

  return (
    <main className="participant-list">
      <button type="button" className="back-link" onClick={onBack}>
        <ChevronLeftIcon />
        Change season/week
      </button>

      <h1>
        Season {pool.season} &middot; Week {pool.week}
      </h1>
      <p>Select a participant to see their picks.</p>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Correct</th>
            <th>Pending</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry) => (
            <tr key={entry.name} data-rank={entry.rank}>
              <td data-label="Rank">
                <span className={medalClass(entry.rank)}>{entry.rank}</span>
              </td>
              <td data-label="Name">
                <button type="button" onClick={() => onSelect(entry.name)}>
                  {entry.name}
                </button>
              </td>
              <td data-label="Correct">
                <span className="record-pill">
                  {entry.correct} / {entry.totalGames}
                </span>
              </td>
              <td data-label="Pending">{entry.pending} pending</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
