"use client"

import { AnimatePresence, motion } from "framer-motion"
import { StreakVisualState } from "@/lib/types"
import { cn } from "@/lib/utils/cn"

export function StreakFireBadge({
  streak,
  state,
  celebrate = false,
  className
}: {
  streak: number
  state: StreakVisualState
  celebrate?: boolean
  className?: string
}) {
  const isActive = state === "active"

  return (
    <motion.div
      animate={
        isActive
          ? {
              y: [0, -5, 0],
              scale: celebrate ? [1, 1.12, 1.04, 1] : [1, 1.03, 1]
            }
          : {
              y: [0, -2, 0],
              scale: [0.96, 0.98, 0.96]
            }
      }
      transition={{
        duration: isActive ? 3.2 : 4.4,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut"
      }}
      className={cn("streak-fire-shell", isActive ? "is-active" : "is-broken", className)}
    >
      <motion.div
        animate={
          isActive
            ? {
                opacity: [0.45, 0.82, 0.5],
                scale: celebrate ? [1, 1.28, 1.08] : [1, 1.12, 1]
              }
            : {
                opacity: [0.12, 0.2, 0.12],
                scale: [0.92, 1, 0.92]
              }
        }
        transition={{
          duration: isActive ? 2.6 : 5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
        className="streak-fire-glow"
      />

      <motion.div
        animate={
          isActive
            ? {
                rotate: [0, -3, 2, 0],
                scaleY: [1, 1.04, 0.98, 1]
              }
            : {
                rotate: [0, -1, 0],
                scaleY: [0.94, 0.98, 0.94]
              }
        }
        transition={{
          duration: isActive ? 2.1 : 4.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
        className="streak-fire-body"
      >
        <span className="streak-fire-number-anchor">
          <motion.span
            animate={isActive ? { y: [0, -1, 0] } : { y: [0, 0.4, 0] }}
            transition={{
              duration: isActive ? 2 : 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut"
            }}
            className="streak-fire-number"
          >
            {streak}
          </motion.span>
        </span>
      </motion.div>

      <div className="streak-fire-core" />

      <AnimatePresence>
        {celebrate ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="streak-fire-sparkles"
          >
            <span />
            <span />
            <span />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
