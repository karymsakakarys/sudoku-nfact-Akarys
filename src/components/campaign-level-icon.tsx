"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import type { CSSProperties } from "react"
import { CampaignNodeState, Difficulty } from "@/lib/types"
import { cn } from "@/lib/utils/cn"

type IconFamily = "easy" | "medium" | "hard" | "master"

const iconRegistry: Record<
  IconFamily,
  {
    open: string
    complete: string
    locked: string
  }
> = {
  easy: {
    open: "/levels/easy-open.png",
    complete: "/levels/easy-complete.png",
    locked: "/levels/locked-common.png"
  },
  medium: {
    open: "/levels/medium-open.png",
    complete: "/levels/medium-complete.png",
    locked: "/levels/locked-common.png"
  },
  hard: {
    open: "/levels/hard-open.png",
    complete: "/levels/hard-complete.png",
    locked: "/levels/locked-common.png"
  },
  master: {
    open: "/levels/master-open.png",
    complete: "/levels/master-complete.png",
    locked: "/levels/locked-master.png"
  }
}

function getIconFamily(difficulty: Difficulty | undefined): IconFamily {
  if (difficulty === "easy") {
    return "easy"
  }
  if (difficulty === "medium") {
    return "medium"
  }
  if (difficulty === "hard") {
    return "hard"
  }
  return "master"
}

export function CampaignLevelIcon({
  difficulty,
  state,
  stageLabel,
  glowColor,
  sizeVariant = "regular"
}: {
  difficulty: Difficulty | undefined
  state: CampaignNodeState
  stageLabel: string
  glowColor: string
  sizeVariant?: "regular" | "current"
}) {
  const family = getIconFamily(difficulty)
  const src =
    state === "locked"
      ? iconRegistry[family].locked
      : state === "completed"
        ? iconRegistry[family].complete
        : iconRegistry[family].open

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={state === "current" ? { y: [0, -5, 0], scale: [1, 1.02, 1] } : { y: 0, scale: 1 }}
        transition={{ duration: 2.3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className={cn(
          "level-icon-shell",
          sizeVariant === "current" ? "is-current-size" : "is-regular-size",
          state === "current" && "is-current",
          state === "locked" && "is-locked"
        )}
        style={{ "--node-glow": glowColor } as CSSProperties}
      >
        <Image
          src={src}
          alt={`Level ${stageLabel}`}
          fill
          sizes={sizeVariant === "current" ? "176px" : "155px"}
          className="object-contain"
          priority={state === "current"}
        />
      </motion.div>
      <span
        className={cn(
          "level-stage",
          sizeVariant === "current" && "is-current-size",
          state === "current" && "is-current"
        )}
      >
        {stageLabel}
      </span>
    </div>
  )
}
