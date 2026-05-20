import { defaultPlayerStats } from "@/lib/sudoku/constants"
import { campaignNodes } from "@/lib/campaign/nodes"
import {
  CampaignState,
  HatId,
  MascotState,
  PersistedSession,
  PlayerStats,
  SuperLevelState,
  ThemeId,
  ThemeMode
} from "@/lib/types"

export interface AppPlayerState {
  themeMode: ThemeMode
  equippedTheme: ThemeId
  ownedThemes: ThemeId[]
  equippedHat: HatId
  ownedHats: HatId[]
  stats: PlayerStats
  campaignState: CampaignState
  savedSessions: Record<string, PersistedSession>
  superLevel: SuperLevelState
  displayName: string
  city: string
  avatarSeed: string
  mascotState: MascotState
}

export const legacyLocalStateStorageKey = "sudoku-mind-garden-state"
export const guestStateStorageKey = `${legacyLocalStateStorageKey}:guest`

export function getUserStateStorageKey(userId: string) {
  return `${legacyLocalStateStorageKey}:${userId}`
}

export const defaultPlayerState: AppPlayerState = {
  themeMode: "light",
  equippedTheme: "base",
  ownedThemes: ["base"],
  equippedHat: "none",
  ownedHats: ["none"],
  stats: defaultPlayerStats,
  campaignState: {
    currentNodeId: "sprout-1",
    completedNodeIds: [],
    claimedChestIds: [],
    lastCompletedNodeId: null,
    lastActiveDate: null
  },
  savedSessions: {},
  superLevel: {
    completedAt: null,
    bestTimeMs: null,
    timesCompleted: 0
  },
  displayName: "Mind Player",
  city: "Алматы",
  avatarSeed: "sudoku-wave",
  mascotState: "idle"
}

export const defaultAuthenticatedPlayerState: AppPlayerState = {
  ...defaultPlayerState,
  stats: {
    ...defaultPlayerStats,
    totalXp: 0,
    level: 1,
    coins: 0,
    gamesPlayed: 0,
    wins: 0,
    perfectClears: 0,
    dailyCompletions: 0,
    lastDailyCompletedAt: null,
    bestTimes: {
      easy: null,
      medium: null,
      hard: null,
      expert: null
    }
  },
  city: ""
}

export function isSuperLevelUnlocked(state: CampaignState) {
  return campaignNodes.every((node) => state.completedNodeIds.includes(node.id))
}

export function normalizeCampaignState(
  input: unknown,
  fallback: CampaignState = defaultPlayerState.campaignState
): CampaignState {
  const validNodeIds = new Set(campaignNodes.map((node) => node.id))

  if (!input || typeof input !== "object") {
    return fallback
  }

  const source = input as Partial<CampaignState>
  const completedNodeIds = Array.isArray(source.completedNodeIds)
    ? source.completedNodeIds.filter(
        (entry): entry is string => typeof entry === "string" && validNodeIds.has(entry)
      )
    : fallback.completedNodeIds
  const currentNodeId =
    typeof source.currentNodeId === "string" && validNodeIds.has(source.currentNodeId)
      ? source.currentNodeId
      : campaignNodes.find((node) => !completedNodeIds.includes(node.id))?.id ?? fallback.currentNodeId

  return {
    currentNodeId,
    completedNodeIds,
    claimedChestIds: Array.isArray(source.claimedChestIds)
      ? source.claimedChestIds.filter((entry): entry is string => typeof entry === "string")
      : fallback.claimedChestIds,
    lastCompletedNodeId:
      typeof source.lastCompletedNodeId === "string" && validNodeIds.has(source.lastCompletedNodeId)
        ? source.lastCompletedNodeId
        : null,
    lastActiveDate: typeof source.lastActiveDate === "string" ? source.lastActiveDate : null
  }
}

export function normalizePlayerState(
  input: unknown,
  fallback: AppPlayerState = defaultPlayerState
): AppPlayerState {
  if (!input || typeof input !== "object") {
    return fallback
  }

  const source = input as Partial<AppPlayerState>
  const campaignState = normalizeCampaignState(source.campaignState, fallback.campaignState)
  const rawStats =
    source.stats && typeof source.stats === "object" ? source.stats : fallback.stats
  const stats = {
    ...fallback.stats,
    ...rawStats
  }
  const ownedHats: HatId[] = Array.isArray(source.ownedHats)
    ? Array.from(
        new Set([
          "none" as HatId,
          ...source.ownedHats.filter(
            (entry): entry is HatId =>
              entry === "none" || entry === "takia" || entry === "sombrero"
          )
        ])
      )
    : fallback.ownedHats

  if (!campaignState.lastActiveDate && campaignState.completedNodeIds.length === 0) {
    stats.streak = 0
    stats.dailyCompletions = 0
    stats.lastDailyCompletedAt = null
  }

  return {
    ...fallback,
    ...source,
    themeMode: "light",
    ownedThemes: Array.isArray(source.ownedThemes)
      ? source.ownedThemes.filter((entry): entry is ThemeId => typeof entry === "string")
      : fallback.ownedThemes,
    ownedHats,
    equippedHat:
      (source.equippedHat === "takia" || source.equippedHat === "sombrero") &&
      ownedHats.includes(source.equippedHat)
        ? source.equippedHat
        : fallback.equippedHat,
    savedSessions:
      source.savedSessions && typeof source.savedSessions === "object"
        ? source.savedSessions
        : fallback.savedSessions,
    superLevel:
      source.superLevel && typeof source.superLevel === "object"
        ? {
            ...fallback.superLevel,
            ...source.superLevel
          }
        : fallback.superLevel,
    stats,
    campaignState
  }
}
