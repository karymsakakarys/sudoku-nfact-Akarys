import { DailyChallengeResult } from "@/lib/types"

export const mockDailyLeaderboard: DailyChallengeResult[] = [
  {
    id: "1",
    displayName: "Aruzhan",
    city: "Алматы",
    durationMs: 7 * 60 * 1000 + 14 * 1000,
    mistakes: 0,
    xp: 152,
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    displayName: "Timur",
    city: "Астана",
    durationMs: 8 * 60 * 1000 + 42 * 1000,
    mistakes: 1,
    xp: 131,
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    displayName: "Dana",
    city: "Шымкент",
    durationMs: 9 * 60 * 1000 + 8 * 1000,
    mistakes: 0,
    xp: 144,
    createdAt: new Date().toISOString()
  }
]

export const mockXpLeaderboard = [
  { rank: 1, displayName: "Mira", level: 14, totalXp: 3410, streak: 21, city: "Алматы" },
  { rank: 2, displayName: "Askar", level: 12, totalXp: 2970, streak: 17, city: "Караганда" },
  { rank: 3, displayName: "Alina", level: 11, totalXp: 2765, streak: 12, city: "Астана" },
  { rank: 4, displayName: "Ilyas", level: 10, totalXp: 2540, streak: 9, city: "Тараз" }
]
