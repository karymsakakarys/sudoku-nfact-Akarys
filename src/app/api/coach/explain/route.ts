import { NextRequest, NextResponse } from "next/server"
import { explainMoveWithAI } from "@/lib/ai/coach"
import { SudokuGrid } from "@/lib/types"

interface ExplainPayload {
  grid: SudokuGrid
  row: number
  col: number
  value?: number | null
  solution?: SudokuGrid
  given?: boolean
}

function isValidGrid(grid: unknown): grid is SudokuGrid {
  return (
    Array.isArray(grid) &&
    grid.length === 9 &&
    grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 9 &&
        row.every((value) => Number.isInteger(value) && value >= 0 && value <= 9)
    )
  )
}

function isValidOptionalSolution(grid: unknown): grid is SudokuGrid | undefined {
  return grid === undefined || isValidGrid(grid)
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ExplainPayload

    if (
      !isValidGrid(payload.grid) ||
      !Number.isInteger(payload.row) ||
      payload.row < 0 ||
      payload.row > 8 ||
      !Number.isInteger(payload.col) ||
      payload.col < 0 ||
      payload.col > 8 ||
      !(
        payload.value === undefined ||
        payload.value === null ||
        (Number.isInteger(payload.value) && payload.value >= 1 && payload.value <= 9)
      ) ||
      !isValidOptionalSolution(payload.solution) ||
      !(
        payload.given === undefined ||
        typeof payload.given === "boolean"
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid coach payload"
        },
        { status: 400 }
      )
    }

    const explanation = await explainMoveWithAI(payload)
    return NextResponse.json(explanation)
  } catch {
    return NextResponse.json(
      {
        error: "Malformed JSON payload"
      },
      { status: 400 }
    )
  }
}
