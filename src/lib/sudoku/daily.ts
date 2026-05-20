import { generateSudokuPuzzle } from "@/lib/sudoku/generator"
import { Difficulty, SudokuPuzzle } from "@/lib/types"
import { getUtcDateKey } from "@/lib/utils/date"

const dailyRotation: Difficulty[] = ["easy", "medium", "hard", "expert", "medium", "hard", "easy"]

export function getDailyDifficulty(dateKey = getUtcDateKey()) {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  return dailyRotation[date.getUTCDay()]
}

export function getDailyPuzzle(dateKey = getUtcDateKey()): SudokuPuzzle {
  const difficulty = getDailyDifficulty(dateKey)
  const puzzle = generateSudokuPuzzle(difficulty, `daily-${dateKey}`)
  return {
    ...puzzle,
    id: `daily-${dateKey}`,
    seed: `daily-${dateKey}`,
    source: "daily"
  }
}

