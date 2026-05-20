import { BoardCell, SudokuGrid } from "@/lib/types"

function deepCloneBoard(board: BoardCell[][]) {
  return board.map((row) => row.map((cell) => ({ ...cell, notes: [...cell.notes] })))
}

export function getCandidates(grid: SudokuGrid, row: number, col: number) {
  if (grid[row][col] !== 0) {
    return []
  }

  const blocked = new Set<number>()
  for (let index = 0; index < 9; index += 1) {
    if (grid[row][index] !== 0) {
      blocked.add(grid[row][index])
    }
    if (grid[index][col] !== 0) {
      blocked.add(grid[index][col])
    }
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      if (grid[r][c] !== 0) {
        blocked.add(grid[r][c])
      }
    }
  }

  return Array.from({ length: 9 }, (_, index) => index + 1).filter(
    (value) => !blocked.has(value)
  )
}

export function annotateBoardConflicts(board: BoardCell[][], solution: SudokuGrid) {
  const nextBoard = deepCloneBoard(board)

  nextBoard.forEach((row) =>
    row.forEach((cell) => {
      cell.conflict = false
      cell.wrong = false
    })
  )

  const groups: BoardCell[][] = []

  for (let index = 0; index < 9; index += 1) {
    groups.push(nextBoard[index])
    groups.push(nextBoard.map((row) => row[index]))
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const cells: BoardCell[] = []
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row += 1) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col += 1) {
          cells.push(nextBoard[row][col])
        }
      }
      groups.push(cells)
    }
  }

  for (const group of groups) {
    const seen = new Map<number, BoardCell[]>()
    group.forEach((cell) => {
      if (!cell.value) {
        return
      }
      const list = seen.get(cell.value) ?? []
      list.push(cell)
      seen.set(cell.value, list)
    })
    seen.forEach((cells) => {
      if (cells.length > 1) {
        cells.forEach((cell) => {
          if (!cell.given) {
            cell.conflict = true
          }
        })
      }
    })
  }

  nextBoard.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => {
      if (cell.value && cell.value !== solution[rowIndex][colIndex]) {
        cell.wrong = true
      }
    })
  )

  return nextBoard
}

export function collectConflictingGivenKeys(
  board: BoardCell[][],
  row: number,
  col: number,
  value: number | null
) {
  if (!value) {
    return []
  }

  const keys = new Set<string>()

  function inspect(targetRow: number, targetCol: number) {
    if (targetRow === row && targetCol === col) {
      return
    }

    const cell = board[targetRow]?.[targetCol]
    if (cell?.given && cell.value === value) {
      keys.add(`${targetRow}-${targetCol}`)
    }
  }

  for (let index = 0; index < 9; index += 1) {
    inspect(row, index)
    inspect(index, col)
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let targetRow = boxRow; targetRow < boxRow + 3; targetRow += 1) {
    for (let targetCol = boxCol; targetCol < boxCol + 3; targetCol += 1) {
      inspect(targetRow, targetCol)
    }
  }

  return Array.from(keys)
}

export function isBoardSolved(board: BoardCell[][], solution: SudokuGrid) {
  return board.every((row, rowIndex) =>
    row.every((cell, colIndex) => cell.value === solution[rowIndex][colIndex])
  )
}

export function findBestHintCell(board: BoardCell[][]) {
  const grid = board.map((row) => row.map((cell) => cell.value ?? 0))
  let best:
    | {
        row: number
        col: number
        candidates: number[]
      }
    | undefined

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.given || cell.value) {
        return
      }

      const candidates = getCandidates(grid, rowIndex, colIndex)
      if (!best || candidates.length < best.candidates.length) {
        best = { row: rowIndex, col: colIndex, candidates }
      }
    })
  })

  return best
}
