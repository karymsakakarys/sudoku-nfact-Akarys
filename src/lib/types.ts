export type Difficulty = "easy" | "medium" | "hard" | "expert"
export type GameMode = "free" | "daily" | "campaign" | "super"
export type ThreeDCameraAngle = "hero" | "left" | "right"

export type ThemeId = "base" | "ocean" | "sunnyBlue"
export type HatId = "none" | "takia" | "sombrero"
export type ThemeMode = "light" | "dark"
export type CampaignTier = "green" | "yellow" | "orange" | "violet"
export type CampaignNodeKind = "puzzle" | "chest" | "teaser"
export type CampaignNodeState = "locked" | "open" | "current" | "completed"
export type MascotState =
  | "idle"
  | "happy"
  | "thinking"
  | "celebrating"
  | "sleepy"
  | "sad"
  | "focused"
  | "streak"
export type StreakVisualState = "active" | "broken"

export type SudokuGrid = number[][]
export type ThreeDSudokuGrid = number[][][]

export interface SudokuPuzzle {
  id: string
  seed: string
  difficulty: Difficulty
  givens: SudokuGrid
  solution: SudokuGrid
  clues: number
  source: "generated" | "daily"
}

export interface ThreeDSudokuPuzzle {
  id: string
  seed: string
  size: 4
  difficulty: "expert"
  givens: ThreeDSudokuGrid
  solution: ThreeDSudokuGrid
  clues: number
  source: "super"
}

export interface BoardCell {
  row: number
  col: number
  value: number | null
  given: boolean
  notes: number[]
  conflict: boolean
  wrong: boolean
}

export interface ThreeDBoardCell {
  layer: number
  row: number
  col: number
  value: number | null
  given: boolean
  conflict: boolean
  wrong: boolean
}

export interface PersistedGameSession {
  sessionId: string
  mode: "free" | "daily" | "campaign"
  difficulty: Difficulty
  nodeId?: string
  dateKey?: string
  puzzle: SudokuPuzzle
  board: BoardCell[][]
  mistakes: number
  hintsUsed: number
  elapsedMs: number
  paused: boolean
  notesMode: boolean
  completedAt?: string | null
}

export interface PersistedSuperSession {
  sessionId: string
  mode: "super"
  difficulty: "expert"
  puzzle: ThreeDSudokuPuzzle
  board: ThreeDBoardCell[][][]
  mistakes: number
  hintsUsed: 0
  elapsedMs: number
  paused: boolean
  notesMode: false
  activeLayer: number
  selectedAngle: ThreeDCameraAngle
  completedAt?: string | null
}

export type PersistedSession = PersistedGameSession | PersistedSuperSession

export interface SuperLevelState {
  completedAt: string | null
  bestTimeMs: number | null
  timesCompleted: number
}

export interface RewardBreakdown {
  xp: number
  coins: number
  speedBonusXp: number
  perfectBonusXp: number
  perfectBonusCoins: number
  label: string
}

export interface ThemePreviewState {
  title: string
  cost: number
  owned: boolean
  equipped: boolean
}

export interface PlayerStats {
  totalXp: number
  level: number
  coins: number
  streak: number
  gamesPlayed: number
  wins: number
  perfectClears: number
  dailyCompletions: number
  bestTimes: Record<Difficulty, number | null>
  lastDailyCompletedAt: string | null
}

export interface DailyChallengeResult {
  id: string
  displayName: string
  city: string | null
  durationMs: number
  mistakes: number
  xp: number
  createdAt: string
}

export interface CoachExplanation {
  title: string
  summary: string
  strategy: string
  candidateList: number[]
  recommendedValue: number | null
  invalidReason?: string
  source?: "openai" | "openrouter" | "fallback"
}

export interface CampaignNode {
  id: string
  order: number
  kind: CampaignNodeKind
  tier: CampaignTier
  difficulty?: Difficulty
  seed?: string
  title: string
  gridLabel: string
  mapX: number
  mapY: number
}

export interface CampaignState {
  currentNodeId: string
  completedNodeIds: string[]
  claimedChestIds: string[]
  lastCompletedNodeId: string | null
  lastActiveDate: string | null
}

export interface ThemeDefinition {
  id: ThemeId
  name: string
  tagline: string
  price: number
  description: string
  preview: {
    accent: string
    secondary: string
    surface: string
  }
  tokens: Record<ThemeMode, Record<string, string>>
}

export interface CloudProfile {
  id: string
  email?: string
  display_name: string | null
  avatar_seed: string | null
  total_xp: number
  coins: number
  streak: number
  games_played: number
  wins: number
  perfect_clears: number
  daily_completions: number
  best_easy_ms: number | null
  best_medium_ms: number | null
  best_hard_ms: number | null
  best_expert_ms: number | null
  last_daily_completed_at: string | null
  selected_theme: ThemeId
  city: string | null
  campaign_state?: CampaignState | null
}
