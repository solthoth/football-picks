export interface Game {
  id: string
  away: string
  home: string
}

export interface Participant {
  name: string
  picks: Record<string, string>
  tieBreakerTotalScore: number | null
}

export type GameStatus = 'scheduled' | 'in_progress' | 'final'

export interface GameResult {
  kickoffTime: string | null
  status: GameStatus
  awayScore: number | null
  homeScore: number | null
  winner: string | null
}

export interface Pool {
  season: number
  week: number
  pot?: number
  games: Game[]
  participants: Participant[]
  results: Record<string, GameResult>
}
