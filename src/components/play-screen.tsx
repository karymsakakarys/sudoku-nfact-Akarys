"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Mascot } from "@/components/mascot"
import { useAppState } from "@/components/providers"
import { SudokuBoard } from "@/components/sudoku-board"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { campaignNodes, getCurrentCampaignNode } from "@/lib/campaign/nodes"
import { explainMove } from "@/lib/sudoku/coach"
import {
  generateSudokuPuzzle,
  makeBoardFromPuzzle,
  serializeBoardValues
} from "@/lib/sudoku/generator"
import {
  annotateBoardConflicts,
  collectConflictingGivenKeys,
  findBestHintCell,
  isBoardSolved
} from "@/lib/sudoku/validation"
import { CoachExplanation, PersistedGameSession } from "@/lib/types"
import { formatDuration } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"

function cloneBoard(board: PersistedGameSession["board"]) {
  return board.map((row) => row.map((cell) => ({ ...cell, notes: [...cell.notes] })))
}

export function PlayScreen({ nodeId }: { nodeId: string }) {
  const router = useRouter()
  const {
    playerState,
    isCampaignNodeUnlocked,
    loadSession,
    saveSession,
    clearSession,
    completeCampaignNode,
    setMascotState
  } = useAppState()
  const node = campaignNodes.find((entry) => entry.id === nodeId)
  const sessionKey = `campaign-${nodeId}`
  const savedSessionRaw = loadSession(sessionKey)
  const savedSession = savedSessionRaw?.mode === "campaign" ? savedSessionRaw : null
  const saveSessionRef = useRef(saveSession)
  const clearSessionRef = useRef(clearSession)
  const completeCampaignNodeRef = useRef(completeCampaignNode)
  const setMascotStateRef = useRef(setMascotState)

  useEffect(() => {
    saveSessionRef.current = saveSession
    clearSessionRef.current = clearSession
    completeCampaignNodeRef.current = completeCampaignNode
    setMascotStateRef.current = setMascotState
  }, [clearSession, completeCampaignNode, saveSession, setMascotState])

  useEffect(() => {
    return () => {
      flashTimeoutsRef.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const basePuzzle = useMemo(() => {
    if (!node || node.kind !== "puzzle" || !node.difficulty || !node.seed) {
      return null
    }
    return generateSudokuPuzzle(node.difficulty, node.seed)
  }, [node])

  const sessionTemplate = useMemo<PersistedGameSession | null>(() => {
    if (!basePuzzle || !node || node.kind !== "puzzle") {
      return null
    }

    return {
      sessionId: sessionKey,
      mode: "campaign",
      difficulty: node.difficulty!,
      nodeId,
      puzzle: basePuzzle,
      board: makeBoardFromPuzzle(basePuzzle),
      mistakes: 0,
      hintsUsed: 0,
      elapsedMs: 0,
      paused: false,
      notesMode: false,
      completedAt: null
    }
  }, [basePuzzle, node, nodeId, sessionKey])

  const [board, setBoard] = useState(sessionTemplate?.board ?? [])
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [elapsedMs, setElapsedMs] = useState(sessionTemplate?.elapsedMs ?? 0)
  const [mistakes, setMistakes] = useState(sessionTemplate?.mistakes ?? 0)
  const [hintsUsed, setHintsUsed] = useState(sessionTemplate?.hintsUsed ?? 0)
  const [notesMode, setNotesMode] = useState(sessionTemplate?.notesMode ?? false)
  const [paused, setPaused] = useState(sessionTemplate?.paused ?? false)
  const [completed, setCompleted] = useState(Boolean(sessionTemplate?.completedAt))
  const [reward, setReward] = useState<{
    xp: number
    coins: number
    streakAwarded: boolean
    streakTotal: number
  } | null>(null)
  const [history, setHistory] = useState<PersistedGameSession["board"][]>([])
  const [future, setFuture] = useState<PersistedGameSession["board"][]>([])
  const [coachOpen, setCoachOpen] = useState(false)
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachExplanation, setCoachExplanation] = useState<CoachExplanation | null>(null)
  const [hydratedSessionKey, setHydratedSessionKey] = useState<string | null>(null)
  const [flashConflictKeys, setFlashConflictKeys] = useState<string[]>([])
  const playMascotState = playerState.mascotState === "idle" ? "focused" : playerState.mascotState
  const flashTimeoutsRef = useRef<number[]>([])

  useEffect(() => {
    if (!node || node.kind !== "puzzle") {
      router.replace("/")
      return
    }

    if (!isCampaignNodeUnlocked(node.id)) {
      const fallbackNode = getCurrentCampaignNode(playerState.campaignState)
      router.replace(`/play/${fallbackNode.id}`)
    }
  }, [isCampaignNodeUnlocked, node, playerState.campaignState, router])

  useEffect(() => {
    if (!sessionTemplate || hydratedSessionKey === sessionKey) {
      return
    }

    const sourceSession = savedSession ?? sessionTemplate

    setBoard(cloneBoard(sourceSession.board))
    setSelectedCell(null)
    setElapsedMs(sourceSession.elapsedMs)
    setMistakes(sourceSession.mistakes)
    setHintsUsed(sourceSession.hintsUsed)
    setNotesMode(sourceSession.notesMode)
    setPaused(sourceSession.paused)
    setCompleted(Boolean(sourceSession.completedAt))
    setReward(null)
    setHistory([])
    setFuture([])
    setCoachOpen(false)
    setCoachLoading(false)
    setCoachExplanation(null)
    setFlashConflictKeys([])
    setHydratedSessionKey(sessionKey)
  }, [hydratedSessionKey, savedSession, sessionKey, sessionTemplate])

  useEffect(() => {
    if (!sessionTemplate || paused || completed) {
      return
    }

    const timer = window.setInterval(() => {
      setElapsedMs((current) => current + 1000)
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [completed, sessionTemplate, paused])

  useEffect(() => {
    if (!sessionTemplate || completed || hydratedSessionKey !== sessionKey) {
      return
    }

    const timer = window.setTimeout(() => {
      saveSessionRef.current(sessionKey, {
        ...sessionTemplate,
        board,
        elapsedMs,
        mistakes,
        hintsUsed,
        paused,
        notesMode
      })
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    board,
    completed,
    elapsedMs,
    hintsUsed,
    hydratedSessionKey,
    mistakes,
    notesMode,
    paused,
    sessionKey,
    sessionTemplate
  ])

  const selectedValue =
    selectedCell ? board[selectedCell.row]?.[selectedCell.col]?.value ?? null : null

  function rememberBoard(nextBoard: PersistedGameSession["board"]) {
    setHistory((current) => [...current.slice(-29), cloneBoard(board)])
    setFuture([])
    setBoard(nextBoard)
  }

  function markSadMoment() {
    setMascotStateRef.current("sad")
    window.setTimeout(() => setMascotStateRef.current("idle"), 900)
  }

  function markThinkingMoment() {
    setMascotStateRef.current("thinking")
    window.setTimeout(() => setMascotStateRef.current("idle"), 1100)
  }

  function flashGivenConflicts(keys: string[]) {
    if (keys.length === 0) {
      return
    }

    setFlashConflictKeys((current) => Array.from(new Set([...current, ...keys])))

    const timer = window.setTimeout(() => {
      setFlashConflictKeys((current) => current.filter((key) => !keys.includes(key)))
    }, 1000)

    flashTimeoutsRef.current.push(timer)
  }

  function handleSelect(row: number, col: number) {
    setSelectedCell({ row, col })
  }

  function placeValueAt(
    target: { row: number; col: number },
    value: number | null,
    asHint = false
  ) {
    if (!basePuzzle || completed) {
      return
    }

    const targetCell = board[target.row][target.col]
    if (targetCell.given) {
      return
    }

    const nextBoard = cloneBoard(board)
    const nextCell = nextBoard[target.row][target.col]

    if (notesMode && value !== null && !asHint) {
      nextCell.notes = nextCell.notes.includes(value)
        ? nextCell.notes.filter((note) => note !== value)
        : [...nextCell.notes, value].sort((left, right) => left - right)
      rememberBoard(nextBoard)
      return
    }

    nextCell.value = value
    nextCell.notes = []

    const givenConflictKeys = collectConflictingGivenKeys(
      nextBoard,
      target.row,
      target.col,
      value
    )
    const annotatedBoard = annotateBoardConflicts(nextBoard, basePuzzle.solution)
    rememberBoard(annotatedBoard)
    flashGivenConflicts(givenConflictKeys)

    if (value !== null && value !== basePuzzle.solution[target.row][target.col]) {
      setMistakes((current) => current + 1)
      markSadMoment()
    }

    if (value !== null && isBoardSolved(annotatedBoard, basePuzzle.solution)) {
      const completedAt = new Date().toISOString()
      const nextReward = completeCampaignNodeRef.current({
        nodeId,
        difficulty: node!.difficulty!,
        elapsedMs,
        mistakes,
        completedAt
      })
      clearSessionRef.current(sessionKey)
      setCompleted(true)
      setReward({
        xp: nextReward.xp,
        coins: nextReward.coins,
        streakAwarded: false,
        streakTotal: playerState.stats.streak
      })
    }
  }

  function writeValue(value: number | null, asHint = false) {
    if (!selectedCell) {
      return
    }

    placeValueAt(selectedCell, value, asHint)
  }

  function handleUndo() {
    if (history.length === 0) {
      return
    }

    const previous = history[history.length - 1]
    setHistory((current) => current.slice(0, -1))
    setFuture((current) => [cloneBoard(board), ...current])
    setBoard(previous)
  }

  function handleRedo() {
    if (future.length === 0) {
      return
    }

    const [nextBoard, ...rest] = future
    setFuture(rest)
    setHistory((current) => [...current, cloneBoard(board)])
    setBoard(nextBoard)
  }

  function handleHint() {
    if (!basePuzzle || completed) {
      return
    }

    const hint = findBestHintCell(board)
    if (!hint) {
      return
    }

    setSelectedCell({ row: hint.row, col: hint.col })
    setHintsUsed((current) => current + 1)
    markThinkingMoment()
    placeValueAt({ row: hint.row, col: hint.col }, basePuzzle.solution[hint.row][hint.col], true)
  }

  async function handleExplainMove() {
    if (!selectedCell || !basePuzzle) {
      return
    }

    setCoachLoading(true)
    setCoachOpen(true)
    markThinkingMoment()

    try {
      const response = await fetch("/api/coach/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grid: serializeBoardValues(board),
          row: selectedCell.row,
          col: selectedCell.col,
          value: board[selectedCell.row][selectedCell.col].value,
          given: board[selectedCell.row][selectedCell.col].given,
          solution: basePuzzle.solution
        })
      })

      const payload = (await response.json()) as CoachExplanation
      setCoachExplanation(payload)
    } catch {
      setCoachExplanation(
        explainMove({
          grid: serializeBoardValues(board),
          row: selectedCell.row,
          col: selectedCell.col,
          value: board[selectedCell.row][selectedCell.col].value,
          solution: basePuzzle.solution
        })
      )
    } finally {
      setCoachLoading(false)
    }
  }

  if (!node || node.kind !== "puzzle" || !basePuzzle || !sessionTemplate) {
    return null
  }

  return (
    <div className="space-y-5">
      <section className="play-topbar">
        <Link href="/" className="play-back">
          ← Карта
        </Link>
        <div className="play-meta">
          <span>{node.gridLabel}</span>
          <span>{formatDuration(elapsedMs)}</span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="play-board-shell">
          <SudokuBoard
            board={board}
            selectedCell={selectedCell}
            onSelect={handleSelect}
            highlightValue={selectedValue}
            disabled={paused || completed}
            flashConflictKeys={flashConflictKeys}
          />

          {paused ? <div className="pause-overlay">Пауза</div> : null}
        </section>

        <aside className="play-side">
          <div className="play-mascot-card">
            <Mascot state={playMascotState} size={104} />
            <div className="play-mascot-copy">
              <p className="play-kicker">Brainy</p>
              <p className="play-caption">{mistakes > 0 ? "Соберись" : "Чистый фокус"}</p>
            </div>
          </div>

          <div className="play-stat-row">
            <div className="play-stat">
              <span>Ошибки</span>
              <strong>{mistakes}</strong>
            </div>
            <div className="play-stat">
              <span>Hints</span>
              <strong>{hintsUsed}</strong>
            </div>
          </div>

          <div className="numpad-grid">
            {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => (
              <button key={value} type="button" onClick={() => writeValue(value)} className="numpad-key">
                {value}
              </button>
            ))}
          </div>

          <div className="play-action-grid">
            <button
              type="button"
              onClick={() => setNotesMode((current) => !current)}
              className={cn("mini-action", notesMode && "is-active")}
            >
              Notes
            </button>
            <button type="button" onClick={() => writeValue(null)} className="mini-action">
              Erase
            </button>
            <button type="button" onClick={handleUndo} className="mini-action">
              Undo
            </button>
            <button type="button" onClick={handleRedo} className="mini-action">
              Redo
            </button>
          </div>

          <div className="space-y-3">
            <Button onClick={handleHint} size="lg">
              Hint
            </Button>
            <Sheet open={coachOpen} onOpenChange={setCoachOpen}>
              <SheetTrigger asChild>
                <Button variant="secondary" size="lg" onClick={handleExplainMove}>
                  Explain move
                </Button>
              </SheetTrigger>
              <SheetContent open={coachOpen}>
                <div className="space-y-3">
                  <div>
                    <SheetTitle className="text-xl font-semibold">AI Coach</SheetTitle>
                    <SheetDescription className="mt-1 text-sm text-soft">
                      Короткое объяснение хода.
                    </SheetDescription>
                  </div>

                  {coachLoading ? (
                    <div className="coach-card">Смотрю логику клетки...</div>
                  ) : coachExplanation ? (
                    <div className="coach-card">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-semibold">{coachExplanation.title}</p>
                        <span className="coach-source-badge">
                          {coachExplanation.source === "fallback"
                            ? "Локальный coach"
                            : coachExplanation.source === "openrouter"
                              ? "OpenRouter AI"
                              : "OpenAI"}
                        </span>
                      </div>
                      <p className="font-semibold">{coachExplanation.summary}</p>
                      <p className="mt-2 text-sm text-soft">
                        {coachExplanation.invalidReason ?? coachExplanation.strategy}
                      </p>
                    </div>
                  ) : (
                    <div className="coach-card">Выбери клетку, и я объясню ход.</div>
                  )}

                  <SheetClose asChild>
                    <Button variant="secondary" size="md">
                      Закрыть
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
            <button type="button" onClick={() => setPaused((current) => !current)} className="mini-action wide">
              {paused ? "Продолжить" : "Пауза"}
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
              <div className="reward-chip-row">
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="reward-chip"
                >
                  +{reward.xp} XP
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 }}
                  className="reward-chip coins"
                >
                  +{reward.coins} coins
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="reward-chip streak"
                >
                  {`🔥 ${reward.streakTotal}`}
                </motion.span>
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
                Дальше
              </Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
