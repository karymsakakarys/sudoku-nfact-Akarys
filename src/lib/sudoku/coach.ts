import { CoachExplanation, SudokuGrid } from "@/lib/types"
import { getCandidates } from "@/lib/sudoku/validation"

const sudokuColumnLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const

export interface ExplainMoveInput {
  grid: SudokuGrid
  row: number
  col: number
  value?: number | null
  solution?: SudokuGrid
  given?: boolean
}

export interface CoachAnalysis {
  row: number
  col: number
  value: number | null
  given: boolean
  candidates: number[]
  conflicts: string[]
  recommendedValue: number | null
  solutionValue: number | null
  rowValues: number[]
  columnValues: number[]
  boxValues: number[]
  cellLabel: string
  isSingleCandidate: boolean
  isEmpty: boolean
}

export function formatSudokuColumnLabel(col: number) {
  return sudokuColumnLabels[col] ?? "?"
}

export function formatSudokuRowLabel(row: number) {
  return `${row + 1}`
}

export function formatSudokuCellLabel(row: number, col: number) {
  return `${formatSudokuColumnLabel(col)}${formatSudokuRowLabel(row)}`
}

export function collectConflicts(grid: SudokuGrid, row: number, col: number, value: number) {
  const reasons: string[] = []
  const rowLabel = formatSudokuRowLabel(row)
  const columnLabel = formatSudokuColumnLabel(col)

  const rowMatch = grid[row].some((cell, index) => index !== col && cell === value)
  if (rowMatch) {
    reasons.push(`В ${rowLabel}-м ряду уже есть цифра ${value}.`)
  }

  const colMatch = grid.some((currentRow, index) => index !== row && currentRow[col] === value)
  if (colMatch) {
    reasons.push(`В колонке ${columnLabel} уже есть цифра ${value}.`)
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  let boxMatch = false
  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      if ((r !== row || c !== col) && grid[r][c] === value) {
        boxMatch = true
      }
    }
  }

  if (boxMatch) {
    reasons.push(`В квадрате 3x3 уже занята цифра ${value}.`)
  }

  return reasons
}

function collectHouseValues(grid: SudokuGrid, row: number, col: number) {
  const rowValues = grid[row].filter((value) => value !== 0)
  const columnValues = grid.map((currentRow) => currentRow[col]).filter((value) => value !== 0)

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  const boxValues: number[] = []
  for (let currentRow = boxRow; currentRow < boxRow + 3; currentRow += 1) {
    for (let currentCol = boxCol; currentCol < boxCol + 3; currentCol += 1) {
      const value = grid[currentRow][currentCol]
      if (value !== 0) {
        boxValues.push(value)
      }
    }
  }

  return { rowValues, columnValues, boxValues }
}

export function analyzeMove(input: ExplainMoveInput): CoachAnalysis {
  const candidates = getCandidates(input.grid, input.row, input.col)
  const value = input.value ?? candidates[0] ?? null
  const { rowValues, columnValues, boxValues } = collectHouseValues(input.grid, input.row, input.col)
  const conflicts = value === null ? [] : collectConflicts(input.grid, input.row, input.col, value)

  return {
    row: input.row,
    col: input.col,
    value,
    given: input.given ?? false,
    candidates,
    conflicts,
    recommendedValue: candidates[0] ?? null,
    solutionValue: input.solution?.[input.row]?.[input.col] ?? null,
    rowValues,
    columnValues,
    boxValues,
    cellLabel: formatSudokuCellLabel(input.row, input.col),
    isSingleCandidate: candidates.length === 1,
    isEmpty: value === null
  }
}

export function explainMove(input: ExplainMoveInput): CoachExplanation {
  const analysis = analyzeMove(input)
  const value = analysis.value

  if (value === null) {
    return {
      title: "Нужен следующий фокус",
      summary: "Эта клетка пока не имеет очевидного хода.",
      strategy: "Сначала очисти строку, столбец и квадрат 3x3, затем вернись к этой клетке.",
      candidateList: analysis.candidates,
      recommendedValue: null,
      source: "fallback"
    }
  }

  if (analysis.given) {
    return {
      title: "Это исходная цифра",
      summary: `Клетка ${analysis.cellLabel} уже задана в пазле как ${value}.`,
      strategy: "Используй эту цифру как опорную точку и ищи ограничения вокруг нее.",
      candidateList: analysis.candidates,
      recommendedValue: value,
      source: "fallback"
    }
  }

  if (analysis.conflicts.length > 0) {
    return {
      title: "Ход конфликтует с правилами",
      summary: `Цифра ${value} сейчас не подходит в клетку ${analysis.cellLabel}.`,
      strategy: "Сначала исключи занятые цифры по строке, столбцу и квадрату 3x3.",
      candidateList: analysis.candidates,
      recommendedValue: analysis.recommendedValue,
      invalidReason: analysis.conflicts.join(" "),
      source: "fallback"
    }
  }

  if (analysis.isSingleCandidate) {
    return {
      title: "Single candidate",
      summary: `Для клетки ${analysis.cellLabel} осталась только цифра ${analysis.candidates[0]}.`,
      strategy: "Это классический single: остальные цифры уже исключены окружением.",
      candidateList: analysis.candidates,
      recommendedValue: analysis.candidates[0],
      source: "fallback"
    }
  }

  const solutionHint =
    input.solution && input.solution[input.row][input.col] === value
      ? `Решение подтверждает, что ${value} ведет сетку к завершению без противоречий.`
      : `Цифра ${value} проходит локальную проверку и не нарушает базовые правила.`

  return {
    title: "Ход выглядит логично",
    summary: `Цифра ${value} подходит по строке, столбцу и квадрату 3x3.`,
    strategy: `${solutionHint} Список допустимых кандидатов здесь: ${analysis.candidates.join(", ")}.`,
    candidateList: analysis.candidates,
    recommendedValue: analysis.recommendedValue ?? value,
    source: "fallback"
  }
}
