"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Mascot } from "@/components/mascot"
import { useAppState } from "@/components/providers"
import { ThreeDSudokuBoard } from "@/components/three-d-sudoku-board"
import { Button } from "@/components/ui/button"
import { createSuperSession, cloneSuperBoard } from "@/lib/super-level/puzzle"
import { annotateSuperBoardConflicts, isSuperBoardSolved } from "@/lib/super-level/validation"
import { PersistedSuperSession, RewardBreakdown } from "@/lib/types"
import { formatDuration } from "@/lib/utils/date"

function cloneSession(session: PersistedSuperSession): PersistedSuperSession {
  return {
    ...session,
    board: cloneSuperBoard(session.board)
  }
}

export function SuperLevelScreen() {
  const router = useRouter()
  const {
    playerState,
    saveSession,
    loadSession,
    clearSession,
    completeSuperLevel,
    setMascotState
  } = useAppState()
  const sessionKey = "super-level-4x4x4"
  const initialSession = useMemo(() => createSuperSession(), [])
  const savedSession = loadSession(sessionKey)
  const saveSessionRef = useRef(saveSession)
  const clearSessionRef = useRef(clearSession)
  const completeSuperLevelRef = useRef(completeSuperLevel)
  const setMascotStateRef = useRef(setMascotState)
  const [session, setSession] = useState<PersistedSuperSession>(initialSession)
  const [selectedCell, setSelectedCell] = useState<{ layer: number; row: number; col: number } | null>(null)
  const [viewMode, setViewMode] = useState<"stack" | "overview">("stack")
  const [history, setHistory] = useState<PersistedSuperSession[]>([])
  const [future, setFuture] = useState<PersistedSuperSession[]>([])
  const [reward, setReward] = useState<RewardBreakdown | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    saveSessionRef.current = saveSession
    clearSessionRef.current = clearSession
    completeSuperLevelRef.current = completeSuperLevel
    setMascotStateRef.current = setMascotState
  }, [clearSession, completeSuperLevel, saveSession, setMascotState])

  useEffect(() => {
    if (hydrated) {
      return
    }

    if (savedSession?.mode === "super" && !savedSession.completedAt) {
      setSession({
        ...savedSession,
        selectedAngle: "hero"
      })
      setViewMode("stack")
      setSelectedCell(null)
    } else {
      setSession(cloneSession(initialSession))
      setViewMode("stack")
      setSelectedCell(null)
    }

    setHydrated(true)
  }, [hydrated, initialSession, savedSession])

  useEffect(() => {
    if (!hydrated || session.paused || session.completedAt) {
      return
    }

    const timer = window.setInterval(() => {
      setSession((current) => ({
        ...current,
        elapsedMs: current.elapsedMs + 1000
      }))
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [hydrated, session.completedAt, session.paused])

  useEffect(() => {
    if (!hydrated || session.completedAt) {
      return
    }

    const timer = window.setTimeout(() => {
      saveSessionRef.current(sessionKey, session)
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [hydrated, session, sessionKey])

  function commit(nextSession: PersistedSuperSession) {
    setHistory((current) => [...current.slice(-29), cloneSession(session)])
    setFuture([])
    setSession(nextSession)
  }

  function markMoment(state: "sad" | "thinking") {
    setMascotStateRef.current(state)
    window.setTimeout(() => setMascotStateRef.current("idle"), 900)
  }

  function activateLayer(layer: number) {
    setSelectedCell(null)
    setViewMode("stack")
    setSession((current) => ({
      ...current,
      activeLayer: layer
    }))
  }

  function showOverview() {
    if (viewMode === "overview") {
      return
    }

    setSelectedCell(null)
    setViewMode("overview")
  }

  function selectCell(layer: number, row: number, col: number) {
    if (viewMode === "overview") {
      activateLayer(layer)
      return
    }

    if (layer !== session.activeLayer) {
      activateLayer(layer)
      return
    }

    setSelectedCell({ layer, row, col })
  }

  function writeValue(value: number | null) {
    if (!selectedCell || session.completedAt || selectedCell.layer !== session.activeLayer) {
      return
    }

    const targetCell = session.board[selectedCell.layer][selectedCell.row][selectedCell.col]
    if (targetCell.given) {
      return
    }

    const nextSession = cloneSession(session)
    const nextCell = nextSession.board[selectedCell.layer][selectedCell.row][selectedCell.col]

    nextCell.value = value
    nextSession.board = annotateSuperBoardConflicts(nextSession.board, nextSession.puzzle.solution)

    if (value !== null && value !== nextSession.puzzle.solution[selectedCell.layer][selectedCell.row][selectedCell.col]) {
      nextSession.mistakes += 1
      markMoment("sad")
    }

    if (value !== null && isSuperBoardSolved(nextSession.board, nextSession.puzzle.solution)) {
      const completedAt = new Date().toISOString()
      nextSession.completedAt = completedAt
      const nextReward = completeSuperLevelRef.current({
        elapsedMs: nextSession.elapsedMs,
        mistakes: nextSession.mistakes,
        completedAt
      })
      clearSessionRef.current(sessionKey)
      setReward(nextReward)
    }

    commit(nextSession)
  }

  function handleErase() {
    if (!selectedCell || session.completedAt || selectedCell.layer !== session.activeLayer) {
      return
    }

    const targetCell = session.board[selectedCell.layer][selectedCell.row][selectedCell.col]
    if (targetCell.given || targetCell.value === null) {
      return
    }

    const nextSession = cloneSession(session)
    nextSession.board[selectedCell.layer][selectedCell.row][selectedCell.col].value = null
    nextSession.board = annotateSuperBoardConflicts(nextSession.board, nextSession.puzzle.solution)
    commit(nextSession)
  }

  function handleUndo() {
    const previous = history.at(-1)
    if (!previous) {
      return
    }

    setFuture((current) => [cloneSession(session), ...current])
    setHistory((current) => current.slice(0, -1))
    setSession(previous)
  }

  function handleRedo() {
    const next = future[0]
    if (!next) {
      return
    }

    setHistory((current) => [...current, cloneSession(session)])
    setFuture((current) => current.slice(1))
    setSession(next)
  }

  return (
    <div className="space-y-5">
      <section className="play-topbar">
        <Link href="/" className="play-back">
          ← Карта
        </Link>
        <div className="play-meta">
          <span>Super 4x4x4</span>
          <span>{formatDuration(session.elapsedMs)}</span>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.38fr)_300px] xl:items-start">
        <section className="play-board-shell super-board-stage w-full">
          <ThreeDSudokuBoard
            board={session.board}
            selectedCell={selectedCell}
            activeLayer={session.activeLayer}
            viewMode={viewMode}
            onActivateLayer={activateLayer}
            onSelectCell={selectCell}
            onBackgroundClick={showOverview}
          />

          {session.paused ? <div className="pause-overlay">Пауза</div> : null}
        </section>

        <aside className="play-side w-full">
          <div className="play-mascot-card">
            <Mascot state={playerState.mascotState === "idle" ? "focused" : playerState.mascotState} size={104} />
            <div className="play-mascot-copy">
              <p className="play-kicker">Cube Mode</p>
              <p className="play-caption">{session.mistakes > 0 ? "Держи вертикали" : "Чистый объём"}</p>
            </div>
          </div>

          <div className="play-stat-row">
            <div className="play-stat">
              <span>Ошибки</span>
              <strong>{session.mistakes}</strong>
            </div>
            <div className="play-stat">
              <span>Активный слой</span>
              <strong>{session.activeLayer + 1}</strong>
            </div>
          </div>

          <div className="super-numpad-grid">
            {Array.from({ length: 4 }, (_, index) => index + 1).map((value) => (
              <button key={value} type="button" onClick={() => writeValue(value)} className="numpad-key">
                {value}
              </button>
            ))}
          </div>

          <div className="play-action-grid">
            <button type="button" onClick={handleErase} className="mini-action">
              Erase
            </button>
            <button type="button" onClick={handleUndo} className="mini-action">
              Undo
            </button>
            <button type="button" onClick={handleRedo} className="mini-action">
              Redo
            </button>
            <button
              type="button"
              onClick={() => {
                setSession((current) => ({
                  ...current,
                  paused: !current.paused
                }))
                markMoment("thinking")
              }}
              className="mini-action"
            >
              {session.paused ? "Продолжить" : "Пауза"}
            </button>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {reward ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="reward-overlay"
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.96 }}
              className="reward-card"
            >
              <Mascot state="celebrating" size={176} />
              <p className="super-kicker">Cube Cleared</p>
              <h2 className="m-0 text-center text-2xl font-semibold">Супер уровень пройден</h2>
              <p className="m-0 text-center text-soft">
                Куб открыт навсегда. Теперь его можно перепроходить ради лучшего времени.
              </p>
              <div className="reward-chip-row">
                <span className="reward-chip">+{reward.xp} XP</span>
                <span className="reward-chip coins">+{reward.coins} coins</span>
                <span className="reward-chip streak">Replay ready</span>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  startTransition(() => {
                    setReward(null)
                    setMascotStateRef.current("idle")
                    router.push("/")
                  })
                }}
              >
                Вернуться на карту
              </Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
