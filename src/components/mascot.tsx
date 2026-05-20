"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { hatRegistry } from "@/lib/brainy-hats"
import { HatId, MascotState } from "@/lib/types"
import { cn } from "@/lib/utils/cn"

const mascotImages: Record<MascotState, string> = {
  idle: "/mascot/idle-brainy.png",
  happy: "/mascot/happy-brainy.png",
  thinking: "/mascot/thinking-brainy.png",
  celebrating: "/mascot/celebrating-brainy.png",
  sleepy: "/mascot/sleeping-brainy.png",
  sad: "/mascot/sad-brainy.png",
  focused: "/mascot/focused-brainy.png",
  streak: "/mascot/streak-mode-brainy.png"
}

const sizeMultiplierByState: Record<MascotState, number> = {
  idle: 1.1,
  happy: 1.12,
  thinking: 1.28,
  celebrating: 1.34,
  sleepy: 1.08,
  sad: 1,
  focused: 1.24,
  streak: 1.14
}

const motionByState: Record<MascotState, { y: number[]; rotate?: number[]; scale?: number[] }> = {
  idle: { y: [0, -7, 0] },
  happy: { y: [0, -10, 0], rotate: [0, -2, 2, 0] },
  thinking: { y: [0, -4, 0], rotate: [0, -3, 0] },
  celebrating: { y: [0, -16, 0], scale: [1, 1.04, 1] },
  sleepy: { y: [0, -2, 0] },
  sad: { y: [0, -3, 0], rotate: [0, -1, 0] },
  focused: { y: [0, -5, 0] },
  streak: { y: [0, -8, 0], scale: [1, 1.03, 1] }
}

export function Mascot({
  state,
  size = 112,
  hatId = "none",
  className
}: {
  state: MascotState
  size?: number
  hatId?: HatId
  className?: string
}) {
  const scale = sizeMultiplierByState[state]
  const hat = hatRegistry[hatId]
  const showHat = Boolean(hat.assetPath)

  return (
    <motion.div
      animate={motionByState[state]}
      transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      className={cn("relative drop-shadow-[0_18px_30px_rgba(69,48,31,0.14)]", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center"
        }}
      >
        <Image
          src={mascotImages[state]}
          alt="Brainy mascot"
          fill
          sizes={`${size}px`}
          className="object-contain"
          priority
        />
      </div>
      {showHat ? (
        <div
          className="absolute pointer-events-none"
          style={hat.overlayStyle}
        >
          <Image
            src={hat.assetPath!}
            alt={hat.name}
            width={256}
            height={256}
            className="h-auto w-full object-contain drop-shadow-[0_14px_20px_rgba(61,43,24,0.16)]"
          />
        </div>
      ) : null}
    </motion.div>
  )
}
