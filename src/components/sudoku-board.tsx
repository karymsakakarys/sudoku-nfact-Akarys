"use client"

import { motion } from "framer-motion"
import { BoardCell } from "@/lib/types"
import { cn } from "@/lib/utils/cn"

const columnLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const
const rowLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

export function SudokuBoard({
  board,
  selectedCell,
  onSelect,
  highlightValue = null,
  disabled = false,
  flashConflictKeys = []
}: {
  board: BoardCell[][]
  selectedCell: { row: number; col: number } | null
  onSelect: (row: number, col: number) => void
  highlightValue?: number | null
  disabled?: boolean
  flashConflictKeys?: string[]
}) {
  return (
    <div className="sudoku-shell rounded-[28px] p-3 sm:p-4">
      <div className="sudoku-board-frame">
        <div className="sudoku-corner-marker" aria-hidden="true" />

        <div className="sudoku-column-labels" aria-hidden="true">
          {columnLabels.map((label) => (
            <span key={label} className="sudoku-axis-label">
              {label}
            </span>
          ))}
        </div>

        <div className="sudoku-row-labels" aria-hidden="true">
          {rowLabels.map((label) => (
            <span key={label} className="sudoku-axis-label">
              {label}
            </span>
          ))}
        </div>

        <div className="sudoku-grid">
          {board.flatMap((row) =>
            row.map((cell) => {
              const cellKey = `${cell.row}-${cell.col}`
              const isSelected =
                selectedCell?.row === cell.row && selectedCell?.col === cell.col
              const isRelated =
                selectedCell &&
                !isSelected &&
                (selectedCell.row === cell.row ||
                  selectedCell.col === cell.col ||
                  (Math.floor(selectedCell.row / 3) === Math.floor(cell.row / 3) &&
                    Math.floor(selectedCell.col / 3) === Math.floor(cell.col / 3)))
              const isMatchingValue =
                !isSelected && highlightValue !== null && cell.value === highlightValue
              const topThick = cell.row % 3 === 0
              const leftThick = cell.col % 3 === 0
              const rightThick = cell.col === 8
              const bottomThick = cell.row === 8
              const isFlashConflict = flashConflictKeys.includes(cellKey)

              return (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  key={cellKey}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(cell.row, cell.col)}
                  className={cn(
                    "sudoku-cell relative aspect-square min-h-[38px] text-base font-semibold sm:min-h-[56px] sm:text-[1.35rem]",
                    cell.given && "given",
                    cell.conflict && "conflict",
                    isFlashConflict && "flash-conflict",
                    isSelected && "active",
                    isRelated && "related",
                    isMatchingValue && "matching",
                    topThick && "border-t-2",
                    leftThick && "border-l-2",
                    rightThick && "border-r-2",
                    bottomThick && "border-b-2"
                  )}
                  aria-label={`Row ${rowLabels[cell.row]}, Column ${columnLabels[cell.col]}`}
                >
                  {cell.value ? (
                    <span className={cell.wrong && !cell.given ? "text-[var(--danger)]" : ""}>
                      {cell.value}
                    </span>
                  ) : (
                    <span className="note-grid grid h-full w-full grid-cols-3 grid-rows-3 p-1 text-[10px] sm:text-xs">
                      {Array.from({ length: 9 }, (_, index) => index + 1).map((note) => (
                        <span
                          key={note}
                          className="flex items-center justify-center opacity-80"
                        >
                          {cell.notes.includes(note) ? note : ""}
                        </span>
                      ))}
                    </span>
                  )}
                </motion.button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
