import {
  PersistedSuperSession,
  ThreeDBoardCell,
  ThreeDCameraAngle,
  ThreeDSudokuGrid,
  ThreeDSudokuPuzzle
} from "@/lib/types"

const superLevelSolution: ThreeDSudokuGrid = [
  [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1]
  ],
  [
    [2, 3, 4, 1],
    [4, 1, 2, 3],
    [3, 2, 1, 4],
    [1, 4, 3, 2]
  ],
  [
    [3, 4, 1, 2],
    [1, 2, 3, 4],
    [4, 3, 2, 1],
    [2, 1, 4, 3]
  ],
  [
    [4, 1, 2, 3],
    [2, 3, 4, 1],
    [1, 4, 3, 2],
    [3, 2, 1, 4]
  ]
]

const superLevelGivens: ThreeDSudokuGrid = [
  [
    [1, 0, 0, 4],
    [0, 4, 1, 0],
    [2, 0, 4, 0],
    [0, 3, 0, 1]
  ],
  [
    [0, 3, 4, 0],
    [4, 0, 0, 3],
    [0, 2, 1, 0],
    [1, 0, 0, 2]
  ],
  [
    [3, 0, 1, 0],
    [0, 2, 0, 4],
    [4, 0, 2, 0],
    [0, 1, 0, 3]
  ],
  [
    [0, 1, 0, 3],
    [2, 0, 4, 0],
    [0, 4, 0, 2],
    [3, 0, 1, 0]
  ]
]

export const superCameraAngles: Array<{
  id: ThreeDCameraAngle
  label: string
}> = [
  { id: "hero", label: "Фронт" },
  { id: "left", label: "Слева" },
  { id: "right", label: "Справа" }
]

export const superLevelPuzzle: ThreeDSudokuPuzzle = {
  id: "super-4x4x4",
  seed: "super-4x4x4-fixed-seed",
  size: 4,
  difficulty: "expert",
  givens: superLevelGivens,
  solution: superLevelSolution,
  clues: superLevelGivens.flat(2).filter(Boolean).length,
  source: "super"
}

export function makeSuperBoardFromPuzzle(puzzle: ThreeDSudokuPuzzle): ThreeDBoardCell[][][] {
  return puzzle.givens.map((layer, layerIndex) =>
    layer.map((row, rowIndex) =>
      row.map((value, colIndex) => ({
        layer: layerIndex,
        row: rowIndex,
        col: colIndex,
        value: value || null,
        given: value !== 0,
        conflict: false,
        wrong: false
      }))
    )
  )
}

export function cloneSuperBoard(board: ThreeDBoardCell[][][]) {
  return board.map((layer) => layer.map((row) => row.map((cell) => ({ ...cell }))))
}

export function createSuperSession(): PersistedSuperSession {
  return {
    sessionId: `super-${superLevelPuzzle.id}`,
    mode: "super",
    difficulty: "expert",
    puzzle: superLevelPuzzle,
    board: makeSuperBoardFromPuzzle(superLevelPuzzle),
    mistakes: 0,
    hintsUsed: 0,
    elapsedMs: 0,
    paused: false,
    notesMode: false,
    activeLayer: 0,
    selectedAngle: "hero",
    completedAt: null
  }
}
