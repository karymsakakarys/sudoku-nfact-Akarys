import { Difficulty, PlayerStats } from "@/lib/types"

export const difficultyClues: Record<Difficulty, number> = {
  easy: 40,
  medium: 33,
  hard: 29,
  expert: 25
}

export const speedTargetsMs: Record<Difficulty, number> = {
  easy: 8 * 60 * 1000,
  medium: 12 * 60 * 1000,
  hard: 18 * 60 * 1000,
  expert: 24 * 60 * 1000
}

export const baseRewards: Record<Difficulty, { xp: number; coins: number }> = {
  easy: { xp: 40, coins: 15 },
  medium: { xp: 70, coins: 20 },
  hard: { xp: 100, coins: 30 },
  expert: { xp: 140, coins: 40 }
}

export const defaultPlayerStats: PlayerStats = {
  totalXp: 120,
  level: 1,
  coins: 220,
  streak: 0,
  gamesPlayed: 4,
  wins: 3,
  perfectClears: 1,
  dailyCompletions: 0,
  lastDailyCompletedAt: null,
  bestTimes: {
    easy: 7 * 60 * 1000 + 23 * 1000,
    medium: 10 * 60 * 1000 + 11 * 1000,
    hard: null,
    expert: null
  }
}
