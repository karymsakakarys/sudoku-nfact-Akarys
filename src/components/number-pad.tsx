"use client"

import { cn } from "@/lib/utils/cn"

export function NumberPad({
  notesMode,
  onToggleNotes,
  onErase,
  onUndo,
  onRedo,
  onHint,
  onPause,
  onNumber
}: {
  notesMode: boolean
  onToggleNotes: () => void
  onErase: () => void
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
  onPause: () => void
  onNumber: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onNumber(value)}
            className="panel-surface rounded-[22px] px-4 py-4 text-lg font-semibold transition-transform hover:-translate-y-0.5"
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <button
          type="button"
          onClick={onToggleNotes}
          className={cn(
            "rounded-2xl px-4 py-3 text-sm font-medium",
            notesMode ? "primary-button" : "secondary-button"
          )}
        >
          Notes
        </button>
        <button type="button" onClick={onErase} className="secondary-button rounded-2xl px-4 py-3 text-sm font-medium">
          Erase
        </button>
        <button type="button" onClick={onUndo} className="secondary-button rounded-2xl px-4 py-3 text-sm font-medium">
          Undo
        </button>
        <button type="button" onClick={onRedo} className="secondary-button rounded-2xl px-4 py-3 text-sm font-medium">
          Redo
        </button>
        <button type="button" onClick={onHint} className="primary-button rounded-2xl px-4 py-3 text-sm font-medium">
          Hint
        </button>
      </div>

      <button type="button" onClick={onPause} className="secondary-button w-full rounded-2xl px-4 py-3 text-sm font-medium">
        Пауза
      </button>
    </div>
  )
}

