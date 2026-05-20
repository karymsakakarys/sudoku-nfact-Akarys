"use client"

import { motion } from "framer-motion"
import { ThreeDBoardCell } from "@/lib/types"
import { cn } from "@/lib/utils/cn"

function getLayerPose(layerIndex: number, activeLayer: number, viewMode: "stack" | "overview") {
  const isActiveLayer = activeLayer === layerIndex
  const stackBaseX = -26
  const stackStepY = 116
  const activeShiftX = 42
  const activeShiftY = 34
  const overviewBaseX = -40
  const overviewStepY = 116
  const depthDistance = Math.abs(layerIndex - activeLayer)
  const stackY = 392 - layerIndex * stackStepY

  if (viewMode === "overview") {
    return {
      x: overviewBaseX,
      y: 376 - layerIndex * overviewStepY,
      scale: 1,
      zIndex: layerIndex + 1,
      opacity: 0.96
    }
  }

  return {
    x: isActiveLayer ? stackBaseX + activeShiftX : stackBaseX,
    y: isActiveLayer ? stackY + activeShiftY : stackY,
    scale: isActiveLayer ? 1.05 : 1 - depthDistance * 0.025,
    zIndex: isActiveLayer ? 40 : layerIndex + 1,
    opacity: isActiveLayer ? 1 : 0.9 - depthDistance * 0.06
  }
}

export function ThreeDSudokuBoard({
  board,
  selectedCell,
  activeLayer,
  viewMode,
  onActivateLayer,
  onSelectCell,
  onBackgroundClick
}: {
  board: ThreeDBoardCell[][][]
  selectedCell: { layer: number; row: number; col: number } | null
  activeLayer: number
  viewMode: "stack" | "overview"
  onActivateLayer: (layer: number) => void
  onSelectCell: (layer: number, row: number, col: number) => void
  onBackgroundClick: () => void
}) {
  const selectedValue =
    viewMode === "stack" && selectedCell && selectedCell.layer === activeLayer
      ? board[activeLayer][selectedCell.row][selectedCell.col]?.value ?? null
      : null

  return (
    <div className="super-board-frame" onClick={onBackgroundClick}>
      <div className="super-stack">
        {board.map((layer, layerIndex) => {
          const isActiveLayer = activeLayer === layerIndex
          const pose = getLayerPose(layerIndex, activeLayer, viewMode)

          return (
            <motion.section
              key={layerIndex}
              initial={false}
              animate={{ x: pose.x, y: pose.y, scale: pose.scale, opacity: pose.opacity }}
              transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.95 }}
              className="super-layer-shell"
              style={{ zIndex: pose.zIndex }}
            >
              <div
                className={cn(
                  "super-layer-plane",
                  isActiveLayer && viewMode === "stack" && "is-active",
                  viewMode === "overview" && "is-overview"
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  onActivateLayer(layerIndex)
                }}
              >
                <div className="super-layer-grid">
                {layer.flatMap((row) =>
                  row.map((cell) => {
                    const cellKey = `${cell.layer}-${cell.row}-${cell.col}`
                    const isSelected =
                      selectedCell?.layer === cell.layer &&
                      selectedCell?.row === cell.row &&
                      selectedCell?.col === cell.col
                    const isRelatedInLayer =
                      selectedCell &&
                      viewMode === "stack" &&
                      selectedCell.layer === cell.layer &&
                      !isSelected &&
                      (selectedCell.row === cell.row ||
                        selectedCell.col === cell.col ||
                        (Math.floor(selectedCell.row / 2) === Math.floor(cell.row / 2) &&
                          Math.floor(selectedCell.col / 2) === Math.floor(cell.col / 2)))
                    const isVerticalMatch =
                      selectedCell &&
                      viewMode === "stack" &&
                      selectedCell.layer === activeLayer &&
                      selectedCell.layer !== cell.layer &&
                      selectedCell.row === cell.row &&
                      selectedCell.col === cell.col
                    const isMatchingValue =
                      Boolean(selectedValue) &&
                      viewMode === "stack" &&
                      cell.layer === activeLayer &&
                      cell.value === selectedValue &&
                      !isSelected
                    const topThick = cell.row % 2 === 0
                    const leftThick = cell.col % 2 === 0
                    const rightThick = cell.col === 3
                    const bottomThick = cell.row === 3

                    return (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        key={cellKey}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (viewMode === "overview") {
                            onActivateLayer(cell.layer)
                            return
                          }

                          if (!isActiveLayer) {
                            onActivateLayer(cell.layer)
                            return
                          }

                          onSelectCell(cell.layer, cell.row, cell.col)
                        }}
                        className={cn(
                          "super-cell",
                          cell.given && "given",
                          cell.conflict && "conflict",
                          isSelected && "active",
                          isMatchingValue && "matching",
                          isRelatedInLayer && "related",
                          isVerticalMatch && "vertical",
                          isActiveLayer ? "layer-active" : "layer-idle",
                          !isActiveLayer && "layer-inactive",
                          topThick && "border-t-2",
                          leftThick && "border-l-2",
                          rightThick && "border-r-2",
                          bottomThick && "border-b-2"
                        )}
                      >
                        <span className={cell.wrong && !cell.given ? "text-[var(--danger)]" : ""}>
                          {cell.value ?? ""}
                        </span>
                      </motion.button>
                    )
                  })
                )}
                </div>
              </div>
            </motion.section>
          )
        })}
      </div>
    </div>
  )
}
