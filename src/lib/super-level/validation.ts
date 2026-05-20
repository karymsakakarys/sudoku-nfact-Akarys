import { ThreeDBoardCell, ThreeDSudokuPuzzle } from "@/lib/types"

function cloneBoard(board: ThreeDBoardCell[][][]) {
  return board.map((layer) => layer.map((row) => row.map((cell) => ({ ...cell }))))
}

export function annotateSuperBoardConflicts(
  board: ThreeDBoardCell[][][],
  solution: ThreeDSudokuPuzzle["solution"]
) {
  const nextBoard = cloneBoard(board)

  nextBoard.forEach((layer) =>
    layer.forEach((row) =>
      row.forEach((cell) => {
        cell.conflict = false
        cell.wrong = false
      })
    )
  )

  const groups: ThreeDBoardCell[][] = []

  for (let layer = 0; layer < 4; layer += 1) {
    for (let index = 0; index < 4; index += 1) {
      groups.push(nextBoard[layer][index])
      groups.push(nextBoard[layer].map((row) => row[index]))
    }

    for (let boxRow = 0; boxRow < 2; boxRow += 1) {
      for (let boxCol = 0; boxCol < 2; boxCol += 1) {
        const cells: ThreeDBoardCell[] = []
        for (let row = boxRow * 2; row < boxRow * 2 + 2; row += 1) {
          for (let col = boxCol * 2; col < boxCol * 2 + 2; col += 1) {
            cells.push(nextBoard[layer][row][col])
          }
        }
        groups.push(cells)
      }
    }
  }

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      groups.push(nextBoard.map((layer) => layer[row][col]))
    }
  }

  for (const group of groups) {
    const seen = new Map<number, ThreeDBoardCell[]>()
    group.forEach((cell) => {
      if (!cell.value) {
        return
      }

      const cells = seen.get(cell.value) ?? []
      cells.push(cell)
      seen.set(cell.value, cells)
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

  nextBoard.forEach((layer, layerIndex) =>
    layer.forEach((row, rowIndex) =>
      row.forEach((cell, colIndex) => {
        if (cell.value && cell.value !== solution[layerIndex][rowIndex][colIndex]) {
          cell.wrong = true
        }
      })
    )
  )

  return nextBoard
}

export function isSuperBoardSolved(
  board: ThreeDBoardCell[][][],
  solution: ThreeDSudokuPuzzle["solution"]
) {
  return board.every((layer, layerIndex) =>
    layer.every((row, rowIndex) =>
      row.every((cell, colIndex) => cell.value === solution[layerIndex][rowIndex][colIndex])
    )
  )
}
