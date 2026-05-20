import { baseRewards, speedTargetsMs } from "@/lib/sudoku/constants"
import { Difficulty, PlayerStats, RewardBreakdown } from "@/lib/types"

export function calculateLevel(totalXp: number) {
  return Math.floor(totalXp / 250) + 1
}

export function calculateReward(params: {
  difficulty: Difficulty
  elapsedMs: number
  mistakes: number
}): RewardBreakdown {
  const base = baseRewards[params.difficulty]
  const speedTarget = speedTargetsMs[params.difficulty]

  const speedFactor = params.elapsedMs <= speedTarget ? 0.3 : Math.max(0, 0.3 - (params.elapsedMs - speedTarget) / speedTarget / 2)
  const speedBonusXp = Math.round(base.xp * speedFactor)
  const perfectBonusXp = params.mistakes === 0 ? Math.round(base.xp * 0.2) : 0
  const perfectBonusCoins = params.mistakes === 0 ? 10 : 0

  return {
    xp: base.xp + speedBonusXp + perfectBonusXp,
    coins: base.coins + perfectBonusCoins,
    speedBonusXp,
    perfectBonusXp,
    perfectBonusCoins,
    label: params.mistakes === 0 ? "Perfect Finish" : "Brain Boost"
  }
}

export function calculateSuperReward(params: {
  elapsedMs: number
  mistakes: number
}): RewardBreakdown {
  const baseXp = 220
  const baseCoins = 75
  const speedBonusXp = params.elapsedMs <= 15 * 60 * 1000 ? 60 : 25
  const perfectBonusXp = params.mistakes === 0 ? 40 : 0
  const perfectBonusCoins = params.mistakes === 0 ? 20 : 0

  return {
    xp: baseXp + speedBonusXp + perfectBonusXp,
    coins: baseCoins + perfectBonusCoins,
    speedBonusXp,
    perfectBonusXp,
    perfectBonusCoins,
    label: params.mistakes === 0 ? "Super Clear" : "Cube Mastery"
  }
}

export function applyRewardToStats(
  stats: PlayerStats,
  reward: RewardBreakdown,
  params: {
    difficulty: Difficulty
    elapsedMs: number
    mistakes: number
    isDaily: boolean
    completedAt: string
  }
) {
  const sameDailyWindow =
    params.isDaily && stats.lastDailyCompletedAt?.slice(0, 10) === params.completedAt.slice(0, 10)

  const nextStats: PlayerStats = {
    ...stats,
    totalXp: stats.totalXp + reward.xp,
    coins: stats.coins + reward.coins,
    gamesPlayed: stats.gamesPlayed + 1,
    wins: stats.wins + 1,
    perfectClears: stats.perfectClears + (params.mistakes === 0 ? 1 : 0),
    dailyCompletions: stats.dailyCompletions + (params.isDaily && !sameDailyWindow ? 1 : 0),
    bestTimes: {
      ...stats.bestTimes,
      [params.difficulty]:
        stats.bestTimes[params.difficulty] === null
          ? params.elapsedMs
          : Math.min(stats.bestTimes[params.difficulty] ?? params.elapsedMs, params.elapsedMs)
    },
    lastDailyCompletedAt: params.isDaily ? params.completedAt : stats.lastDailyCompletedAt,
    streak: stats.streak
  }

  if (params.isDaily) {
    const previousDate = stats.lastDailyCompletedAt?.slice(0, 10)
    const currentDate = params.completedAt.slice(0, 10)
    nextStats.streak = previousDate === currentDate ? stats.streak : stats.streak + 1
  }

  nextStats.level = calculateLevel(nextStats.totalXp)
  return nextStats
}
