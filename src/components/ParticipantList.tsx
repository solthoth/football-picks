import type { Pool } from '../data/types'
import { buildLeaderboard } from '../domain/standings'

interface ParticipantListProps {
  pool: Pool
  onSelect: (participantName: string) => void
  onBack: () => void
}

export function ParticipantList({ pool, onSelect, onBack }: ParticipantListProps) {
  const leaderboard = buildLeaderboard(pool)

  return (
    <main className="participant-list">
      <button type="button" onClick={onBack}>
        &larr; Change season/week
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
            <tr key={entry.name}>
              <td>{entry.rank}</td>
              <td>
                <button type="button" onClick={() => onSelect(entry.name)}>
                  {entry.name}
                </button>
              </td>
              <td>
                {entry.correct} / {entry.totalGames}
              </td>
              <td>{entry.pending}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
