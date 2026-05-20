"use client"

import { campaignTierColors } from "@/lib/campaign/nodes"
import { CampaignTier } from "@/lib/types"
import { cn } from "@/lib/utils/cn"

export function BatteryBadge({
  fill,
  tier,
  className
}: {
  fill: 1 | 2 | 3 | 4
  tier: CampaignTier
  className?: string
}) {
  const colors = campaignTierColors[tier]

  return (
    <div
      className={cn(
        "relative flex h-8 w-[22px] flex-col justify-end gap-0.5 rounded-[10px] border bg-white/80 p-1 shadow-[0_6px_18px_rgba(60,44,25,0.08)]",
        className
      )}
      style={{ borderColor: "rgba(86,66,43,0.24)" }}
    >
      <span className="absolute left-1/2 top-[-4px] h-[4px] w-[8px] -translate-x-1/2 rounded-t-full border border-b-0 bg-white/90" style={{ borderColor: "rgba(86,66,43,0.24)" }} />
      {Array.from({ length: 4 }, (_, index) => {
        const active = 4 - index <= fill
        return (
          <span
            key={index}
            className="h-1.5 rounded-full transition-colors"
            style={{
              background: active ? colors.shell : "rgba(132,116,98,0.12)",
              boxShadow: active ? `0 0 12px ${colors.glow}` : "none"
            }}
          />
        )
      })}
    </div>
  )
}
