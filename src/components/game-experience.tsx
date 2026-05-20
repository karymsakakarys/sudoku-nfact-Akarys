"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState, startTransition } from "react"
import { NumberPad } from "@/components/number-pad"
import { SudokuBoard } from "@/components/sudoku-board"
import { useAppState } from "@/components/providers"
import { getDailyDifficulty, getDailyPuzzle } from "@/lib/sudoku/daily"
import { generateSudokuPuzzle, makeBoardFromPuzzle } from "@/lib/sudoku/generator"
import { annotateBoardConflicts, findBestHintCell, getCandidates, isBoardSolved } from "@/lib/sudoku/validation"
import { Difficulty, PersistedGameSession, RewardBreakdown } from "@/lib/types"
import { formatDuration, getUtcDateKey } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"

function cloneSession(session: PersistedGameSession): PersistedGameSession {
  return {
    ...session,
    board: session.board.map((row) =>
      row.map((cell) => ({
        ...cell,
        notes: [...cell.notes]
      }))
    )
  }
}

export function GameExperience({
  mode,
  initialDifficulty = "medium"
}: {
  mode: "free" | "daily"
  initialDifficulty?: Difficulty
}) {
  const { loadSession, saveSession, clearSession, recordCompletion } = useAppState()
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty)
  const [session, setSession] = useState<PersistedGameSession | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [history, setHistory] = useState<PersistedGameSession[]>([])
  const [future, setFuture] = useState<PersistedGameSession[]>([])
  const [coachText, setCoachText] = useState<string>("")
  const [coachLoading, setCoachLoading] = useState(false)
  const [reward, setReward] = useState<RewardBreakdown | null>(null)
  const [paused, setPaused] = useState(false)
  const dateKey = getUtcDateKey()
  const sessionKey = mode === "daily" ? `daily-${dateKey}` : `free-${difficulty}`
  const intervalRef = useRef<number | null>(null)

  const label = mode === "daily" ? "Daily Challenge" : "Свободная игра"

  const startFreshSession = (targetDifficulty: Difficulty) => {
    const puzzle =
      mode === "daily" ? getDailyPuzzle(dateKey) : generateSudokuPuzzle(targetDifficulty)

    const nextSession: PersistedGameSession = {
      sessionId: `${mode}-${puzzle.id}`,
      mode,
      difficulty: mode === "daily" ? puzzle.difficulty : targetDifficulty,
      dateKey: mode === "daily" ? dateKey : undefined,
      puzzle,
      board: annotateBoardConflicts(makeBoardFromPuzzle(puzzle), puzzle.solution),
      mistakes: 0,
      hintsUsed: 0,
      elapsedMs: 0,
      paused: false,
      notesMode: false,
      completedAt: null
    }

    startTransition(() => {
      setSession(nextSession)
      setSelectedCell(null)
      setHistory([])
      setFuture([])
      setReward(null)
      setCoachText("")
      setPaused(false)
    })
  }

  useEffect(() => {
    const saved = loadSession(sessionKey)
    if (saved?.mode === mode && !saved.completedAt) {
      setSession(saved)
      setPaused(saved.paused)
      return
    }
    startFreshSession(mode === "daily" ? getDailyDifficulty(dateKey) : difficulty)
  }, [dateKey, difficulty, loadSession, mode, sessionKey])

  useEffect(() => {
    if (!session || paused || session.completedAt) {
      return
    }

    intervalRef.current = window.setInterval(() => {
      setSession((current) =>
        current
          ? {
              ...current,
              elapsedMs: current.elapsedMs + 1000
            }
          : current
      )
    }, 1000)

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [paused, session])

  useEffect(() => {
    if (!session) {
      return
    }

    if (session.completedAt) {
      clearSession(sessionKey)
      return
    }

    const timeout = window.setTimeout(() => {
      saveSession(sessionKey, {
        ...session,
        paused
      })
    }, 250)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [clearSession, paused, saveSession, session, sessionKey])

  const completionRate = useMemo(() => {
    if (!session) {
      return 0
    }
    const filled = session.board.flat().filter((cell) => cell.value).length
    return Math.round((filled / 81) * 100)
  }, [session])

  function commitBoard(nextSession: PersistedGameSession) {
    if (!session) {
      return
    }
    setHistory((current) => [...current, cloneSession(session)])
    setFuture([])
    setSession(nextSession)
  }

  function handleSelect(row: number, col: number) {
    setSelectedCell({ row, col })
  }

  function handleNumber(value: number) {
    if (!session || !selectedCell) {
      return
    }

    const cell = session.board[selectedCell.row][selectedCell.col]
    if (cell.given) {
      return
    }

    const nextSession = cloneSession(session)
    const target = nextSession.board[selectedCell.row][selectedCell.col]

    if (nextSession.notesMode) {
      target.notes = target.notes.includes(value)
        ? target.notes.filter((item) => item !== value)
        : [...target.notes, value].sort()
      commitBoard(nextSession)
      return
    }

    const previousValue = target.value
    if (previousValue === value) {
      return
    }

    target.value = value
    target.notes = []
    if (value !== nextSession.puzzle.solution[selectedCell.row][selectedCell.col]) {
      nextSession.mistakes += previousValue === value ? 0 : 1
    }

    const validated = annotateBoardConflicts(nextSession.board, nextSession.puzzle.solution)
    nextSession.board = validated

    if (isBoardSolved(validated, nextSession.puzzle.solution)) {
      const completedAt = new Date().toISOString()
      nextSession.completedAt = completedAt
      const nextReward = recordCompletion({
        difficulty: nextSession.difficulty,
        elapsedMs: nextSession.elapsedMs,
        mistakes: nextSession.mistakes,
        isDaily: mode === "daily",
        completedAt
      })
      setReward(nextReward)
      setPaused(true)
    }

    commitBoard(nextSession)
  }

  function handleErase() {
    if (!session || !selectedCell) {
      return
    }
    const cell = session.board[selectedCell.row][selectedCell.col]
    if (cell.given || (!cell.value && cell.notes.length === 0)) {
      return
    }
    const nextSession = cloneSession(session)
    nextSession.board[selectedCell.row][selectedCell.col].value = null
    nextSession.board[selectedCell.row][selectedCell.col].notes = []
    nextSession.board = annotateBoardConflicts(nextSession.board, nextSession.puzzle.solution)
    commitBoard(nextSession)
  }

  function handleUndo() {
    const previous = history.at(-1)
    if (!previous || !session) {
      return
    }
    setFuture((current) => [cloneSession(session), ...current])
    setHistory((current) => current.slice(0, -1))
    setSession(previous)
  }

  function handleRedo() {
    const next = future[0]
    if (!next || !session) {
      return
    }
    setHistory((current) => [...current, cloneSession(session)])
    setFuture((current) => current.slice(1))
    setSession(next)
  }

  function handleHint() {
    if (!session) {
      return
    }
    const hint = findBestHintCell(session.board)
    if (!hint) {
      return
    }

    const nextSession = cloneSession(session)
    nextSession.hintsUsed += 1
    nextSession.board[hint.row][hint.col].value = nextSession.puzzle.solution[hint.row][hint.col]
    nextSession.board[hint.row][hint.col].notes = []
    nextSession.board = annotateBoardConflicts(nextSession.board, nextSession.puzzle.solution)
    setSelectedCell({ row: hint.row, col: hint.col })
    commitBoard(nextSession)
  }

  async function handleExplain() {
    if (!session) {
      return
    }
    setCoachLoading(true)
    const target = selectedCell ?? findBestHintCell(session.board)
    if (!target) {
      setCoachText("Сейчас нет явного хода. Попробуй очистить конфликтные клетки.")
      setCoachLoading(false)
      return
    }

    const grid = session.board.map((row) => row.map((cell) => cell.value ?? 0))
    const response = await fetch("/api/coach/explain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        grid,
        row: target.row,
        col: target.col,
        value: selectedCell ? session.board[target.row][target.col].value : null,
        solution: session.puzzle.solution
      })
    })
    const payload = await response.json()
    setCoachText(`${payload.title}. ${payload.summary} ${payload.invalidReason ?? payload.strategy}`)
    setCoachLoading(false)
  }

  if (!session) {
    return null
  }

  const candidateInfo =
    selectedCell &&
    getCandidates(
      session.board.map((row) => row.map((cell) => cell.value ?? 0)),
      selectedCell.row,
      selectedCell.col
    )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_380px]">
      <section className="space-y-6">
        <div className="app-surface rounded-[32px] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-soft">{label}</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                {mode === "daily" ? "Одна сетка на всех сегодня" : "Выбери ритм и входи в поток"}
              </h1>
              <p className="mt-2 text-soft">
                {mode === "daily"
                  ? "Общий seed, общий рейтинг, одна попытка удержать streak."
                  : "Четыре сложности, мягкая валидация, заметки, hint и живая аналитика."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="panel-surface rounded-[24px] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-soft">Time</p>
                <p className="mt-2 text-2xl font-semibold">{formatDuration(session.elapsedMs)}</p>
              </div>
              <div className="panel-surface rounded-[24px] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-soft">Progress</p>
                <p className="mt-2 text-2xl font-semibold">{completionRate}%</p>
              </div>
            </div>
          </div>

          {mode === "free" ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {(["easy", "medium", "hard", "expert"] as Difficulty[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDifficulty(item)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm capitalize",
                    difficulty === item ? "primary-button" : "secondary-button"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm text-[var(--accent)]">
              Сегодняшняя сложность: {getDailyDifficulty(dateKey)}
            </div>
          )}
        </div>

        <SudokuBoard board={session.board} selectedCell={selectedCell} onSelect={handleSelect} />
      </section>

      <aside className="space-y-4">
        <div className="app-surface rounded-[32px] p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="panel-surface rounded-2xl px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-soft">Mistakes</p>
              <p className="mt-2 text-xl font-semibold">{session.mistakes}</p>
            </div>
            <div className="panel-surface rounded-2xl px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-soft">Hints</p>
              <p className="mt-2 text-xl font-semibold">{session.hintsUsed}</p>
            </div>
            <div className="panel-surface rounded-2xl px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-soft">Clues</p>
              <p className="mt-2 text-xl font-semibold">{session.puzzle.clues}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] bg-[var(--reward)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-soft">AI Coach</p>
            <h2 className="mt-2 text-xl font-semibold">Explain this move</h2>
            <p className="mt-2 text-sm text-soft">
              {selectedCell
                ? `Фокус: R${selectedCell.row + 1}C${selectedCell.col + 1}.`
                : "Выбери клетку, и Coach разложит ход по-человечески."}
            </p>
            {candidateInfo && candidateInfo.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {candidateInfo.map((candidate) => (
                  <span key={candidate} className="rounded-full bg-white/40 px-3 py-1 text-xs">
                    {candidate}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={handleExplain}
              className="primary-button mt-4 w-full rounded-2xl px-4 py-3 text-sm font-medium"
            >
              {coachLoading ? "Думаю..." : "Explain this move"}
            </button>
            {coachText && <p className="mt-3 text-sm text-[var(--foreground)]">{coachText}</p>}
          </div>
        </div>

        <div className="app-surface rounded-[32px] p-5">
          <NumberPad
            notesMode={session.notesMode}
            onToggleNotes={() =>
              setSession((current) =>
                current
                  ? {
                      ...current,
                      notesMode: !current.notesMode
                    }
                  : current
              )
            }
            onErase={handleErase}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onHint={handleHint}
            onPause={() => setPaused((current) => !current)}
            onNumber={handleNumber}
          />
        </div>

        <div className="app-surface rounded-[32px] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-soft">Stretch feature</p>
          <h3 className="mt-2 text-xl font-semibold">3D Sudoku</h3>
          <p className="mt-2 text-sm text-soft">
            Premium teaser: handcrafted rotating cube mode появится как hidden upgrade после core MVP.
          </p>
          <button type="button" className="secondary-button mt-4 w-full rounded-2xl px-4 py-3 text-sm font-medium">
            Скоро откроется
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {paused && !reward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          >
            <div className="app-surface w-full max-w-md rounded-[32px] p-6 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-soft">Pause</p>
              <h3 className="mt-3 text-3xl font-semibold">Глубокий вдох</h3>
              <p className="mt-3 text-soft">
                Партия поставлена на паузу. Таймер не тикает, прогресс сохранен.
              </p>
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="primary-button mt-6 w-full rounded-2xl px-4 py-3 font-medium"
              >
                Вернуться в поток
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="app-surface w-full max-w-lg rounded-[36px] p-6 text-center"
            >
              <p className="text-sm uppercase tracking-[0.24em] text-soft">{reward.label}</p>
              <h3 className="mt-3 text-4xl font-semibold">Grid Cleared</h3>
              <p className="mt-3 text-soft">
                +{reward.xp} XP, +{reward.coins} coins
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="panel-surface rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-soft">Base</p>
                  <p className="mt-2 text-lg font-semibold">{reward.xp - reward.speedBonusXp - reward.perfectBonusXp} XP</p>
                </div>
                <div className="panel-surface rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-soft">Speed</p>
                  <p className="mt-2 text-lg font-semibold">+{reward.speedBonusXp}</p>
                </div>
                <div className="panel-surface rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-soft">Perfect</p>
                  <p className="mt-2 text-lg font-semibold">+{reward.perfectBonusXp}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => startFreshSession(mode === "daily" ? getDailyDifficulty(dateKey) : difficulty)}
                  className="primary-button flex-1 rounded-2xl px-4 py-3 font-medium"
                >
                  Новая сетка
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReward(null)
                    setPaused(false)
                  }}
                  className="secondary-button flex-1 rounded-2xl px-4 py-3 font-medium"
                >
                  Остаться на экране
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
