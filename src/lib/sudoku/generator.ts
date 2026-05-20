import { difficultyClues } from "@/lib/sudoku/constants"
import { BoardCell, Difficulty, SudokuGrid, SudokuPuzzle } from "@/lib/types"

function hashSeed(seed: string) {
  let value = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function createRng(seed: string) {
  let state = hashSeed(seed) || 123456789
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

function cloneGrid(grid: SudokuGrid): SudokuGrid {
  return grid.map((row) => [...row])
}

function emptyGrid(): SudokuGrid {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0))
}

function shuffle<T>(items: T[], rng: () => number) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

function isValidPlacement(grid: SudokuGrid, row: number, col: number, value: number) {
  for (let index = 0; index < 9; index += 1) {
    if (grid[row][index] === value || grid[index][col] === value) {
      return false
    }
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3

  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      if (grid[r][c] === value) {
        return false
      }
    }
  }

  return true
}

function fillGrid(grid: SudokuGrid, rng: () => number, cellIndex = 0): boolean {
  if (cellIndex >= 81) {
    return true
  }

  const row = Math.floor(cellIndex / 9)
  const col = cellIndex % 9

  if (grid[row][col] !== 0) {
    return fillGrid(grid, rng, cellIndex + 1)
  }

  const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)
  for (const candidate of candidates) {
    if (!isValidPlacement(grid, row, col, candidate)) {
      continue
    }

    grid[row][col] = candidate
    if (fillGrid(grid, rng, cellIndex + 1)) {
      return true
    }
    grid[row][col] = 0
  }

  return false
}

function countSolutions(grid: SudokuGrid, limit = 2) {
  const workingGrid = cloneGrid(grid)
  let solutions = 0

  function solve(cellIndex = 0) {
    if (solutions >= limit) {
      return
    }

    if (cellIndex >= 81) {
      solutions += 1
      return
    }

    const row = Math.floor(cellIndex / 9)
    const col = cellIndex % 9

    if (workingGrid[row][col] !== 0) {
      solve(cellIndex + 1)
      return
    }

    for (let value = 1; value <= 9; value += 1) {
      if (!isValidPlacement(workingGrid, row, col, value)) {
        continue
      }

      workingGrid[row][col] = value
      solve(cellIndex + 1)
      workingGrid[row][col] = 0
    }
  }

  solve()
  return solutions
}

function carvePuzzle(solution: SudokuGrid, cluesTarget: number, rng: () => number) {
  const puzzle = cloneGrid(solution)
  const cellOrder = shuffle(
    Array.from({ length: 81 }, (_, index) => index),
    rng
  )

  let remainingClues = 81
  for (const index of cellOrder) {
    if (remainingClues <= cluesTarget) {
      break
    }

    const row = Math.floor(index / 9)
    const col = index % 9
    const backup = puzzle[row][col]

    puzzle[row][col] = 0
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[row][col] = backup
      continue
    }

    remainingClues -= 1
  }

  return puzzle
}

export function makeBoardFromPuzzle(puzzle: SudokuPuzzle): BoardCell[][] {
  return puzzle.givens.map((row, rowIndex) =>
    row.map((value, colIndex) => ({
      row: rowIndex,
      col: colIndex,
      value: value || null,
      given: value !== 0,
      notes: [],
      conflict: false,
      wrong: false
    }))
  )
}

export function serializeBoardValues(board: BoardCell[][]): SudokuGrid {
  return board.map((row) => row.map((cell) => cell.value ?? 0))
}

export function generateSudokuPuzzle(
  difficulty: Difficulty,
  seed = `${difficulty}-${Date.now()}`
): SudokuPuzzle {
  const rng = createRng(seed)
  const solution = emptyGrid()
  fillGrid(solution, rng)
  const givens = carvePuzzle(solution, difficultyClues[difficulty], rng)
  const clues = givens.flat().filter(Boolean).length

  return {
    id: `${difficulty}-${seed}`,
    seed,
    difficulty,
    givens,
    solution,
    clues,
    source: "generated"
  }
}

