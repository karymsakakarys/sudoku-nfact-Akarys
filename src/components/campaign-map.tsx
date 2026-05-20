"use client"

import Link from "next/link"
import { type CSSProperties, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Coins, Flag, Sparkles } from "lucide-react"
import { CampaignLevelIcon } from "@/components/campaign-level-icon"
import { Mascot } from "@/components/mascot"
import { StreakFireBadge } from "@/components/streak-fire-badge"
import { buttonVariants } from "@/components/ui/button"
import { useAppState } from "@/components/providers"
import { campaignNodes, campaignTierColors, getCurrentCampaignNode } from "@/lib/campaign/nodes"
import { formatCompactNumber } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"

function getMascotPosition(mapX: number, mapY: number) {
  const xOffset = mapX >= 52 ? -20 : 20
  const yOffset = 1

  return {
    left: `${mapX + xOffset}%`,
    top: `${mapY + yOffset}%`
  }
}

export function CampaignMap() {
  const { playerState, getCampaignNodeState, isCampaignNodeUnlocked } = useAppState()
  const currentNode = getCurrentCampaignNode(playerState.campaignState)
  const currentNodeColors = campaignTierColors[currentNode.tier]
  const currentNodeRef = useRef<HTMLDivElement | null>(null)
  const autoScrolledNodeIdRef = useRef<string | null>(null)
  const mascotPosition = getMascotPosition(currentNode.mapX, currentNode.mapY)
  const streakState = playerState.stats.streak > 0 ? "active" : "broken"

  useEffect(() => {
    if (autoScrolledNodeIdRef.current === currentNode.id) {
      return
    }

    function scrollToCurrentNode() {
      const node = currentNodeRef.current
      if (!node) {
        return false
      }

      const rect = node.getBoundingClientRect()
      const nodeCenter = window.scrollY + rect.top + rect.height / 2
      const viewportTarget = Math.max(0, nodeCenter - window.innerHeight * 0.42)

      window.scrollTo({
        top: viewportTarget,
        behavior: "auto"
      })

      autoScrolledNodeIdRef.current = currentNode.id
      return true
    }

    let retryTimer: number | null = null

    const frame = window.requestAnimationFrame(() => {
      if (scrollToCurrentNode()) {
        return
      }

      retryTimer = window.setTimeout(() => {
        scrollToCurrentNode()
      }, 80)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      if (retryTimer) {
        window.clearTimeout(retryTimer)
      }
    }
  }, [currentNode.id])

  return (
    <div className="map-page">
      <section className="map-summary">
        <div className="summary-chip metric-chip">
          <span className="metric-icon">
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <strong>{formatCompactNumber(playerState.stats.totalXp)}</strong>
        </div>
        <div className="summary-chip metric-chip">
          <span className="metric-icon coins">
            <Coins className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <strong>{formatCompactNumber(playerState.stats.coins)}</strong>
        </div>
        <div
          className="summary-chip current-chip metric-chip"
          style={{ "--chip-glow": currentNodeColors.glow } as CSSProperties}
        >
          <span className="metric-icon level">
            <Flag className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <strong>{currentNode.gridLabel}</strong>
        </div>
      </section>

      <section className="map-surface">
        <div className="map-surface-fire">
          <StreakFireBadge
            streak={playerState.stats.streak}
            state={streakState}
            celebrate={streakState === "active"}
          />
        </div>

        <div className="map-field">
          {campaignNodes.map((node) => {
            const nodeState = getCampaignNodeState(node.id)
            const colors = campaignTierColors[node.tier]
            const sizeVariant = nodeState === "current" ? "current" : "regular"
            const unlocked = isCampaignNodeUnlocked(node.id)

            return (
              <motion.div
                key={node.id}
                layout
                className="level-node-anchor"
                style={{ left: `${node.mapX}%`, top: `${node.mapY}%` }}
                ref={nodeState === "current" ? currentNodeRef : undefined}
              >
                {!unlocked ? (
                  <div className="level-node-link">
                    <CampaignLevelIcon
                      difficulty={node.difficulty}
                      state={nodeState}
                      stageLabel={node.gridLabel}
                      glowColor={colors.glow}
                      sizeVariant={sizeVariant}
                    />
                  </div>
                ) : (
                  <Link href={`/play/${node.id}`} className="level-node-link">
                    <CampaignLevelIcon
                      difficulty={node.difficulty}
                      state={nodeState}
                      stageLabel={node.gridLabel}
                      glowColor={colors.glow}
                      sizeVariant={sizeVariant}
                    />
                  </Link>
                )}
              </motion.div>
            )
          })}

          <motion.div
            layout
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            className="map-mascot"
            style={mascotPosition}
          >
            <Mascot state={playerState.mascotState} size={144} hatId={playerState.equippedHat} />
          </motion.div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href={`/play/${currentNode.id}`}
            className={cn(buttonVariants({ size: "lg", variant: "primary" }), "px-8")}
          >
            Играть
          </Link>
        </div>
      </section>
    </div>
  )
}
