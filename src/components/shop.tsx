"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Coins, ShoppingBag } from "lucide-react"
import { Mascot } from "@/components/mascot"
import { Button } from "@/components/ui/button"
import { useAppState } from "@/components/providers"
import { hatOrder, hatRegistry } from "@/lib/brainy-hats"
import { HatId } from "@/lib/types"
import { cn } from "@/lib/utils/cn"

function getHatStatusLabel(hatId: HatId, owned: boolean, equipped: boolean) {
  if (equipped) {
    return "Надет"
  }

  if (hatId === "none") {
    return "Всегда доступен"
  }

  return owned ? "Куплен" : "Закрыт"
}

export function Shop() {
  const { playerState, purchaseHat, equipHat } = useAppState()
  const [feedback, setFeedback] = useState("")

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="map-brow">Brainy Closet</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="chrome-section-icon">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <h1 className="text-3xl font-semibold">Shop</h1>
          </div>
          <p className="mt-3 text-sm text-soft">Небольшие уборы для Brainy на карте. Легко, аккуратно, без перегруза.</p>
        </div>
        <div className="summary-chip">
          <span>Coins</span>
          <strong>{playerState.stats.coins}</strong>
        </div>
      </div>

      <div className="space-y-3">
        {hatOrder.map((hatId) => {
          const hat = hatRegistry[hatId]
          const owned = playerState.ownedHats.includes(hatId)
          const equipped = playerState.equippedHat === hatId
          const canBuy = hat.price > 0 && !owned
          const tooExpensive = hat.price > playerState.stats.coins

          return (
            <motion.article key={hatId} layout className="hat-card">
              <div
                className="hat-preview-shell"
                style={{ background: `linear-gradient(145deg, ${hat.accent}, rgba(255,255,255,0.72))` }}
              >
                <div className="hat-preview-ring">
                  <Mascot state="idle" size={96} hatId={hatId} />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold">{hat.name}</h3>
                    <p className="mt-1 text-sm text-soft">{getHatStatusLabel(hatId, owned, equipped)}</p>
                  </div>
                  <div className="hat-price-pill">
                    <Coins className="h-4 w-4" strokeWidth={2.2} />
                    <strong>{hat.price === 0 ? "Free" : hat.price}</strong>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {equipped ? (
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]">
                      Equipped
                    </span>
                  ) : canBuy ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={tooExpensive ? "secondary" : "primary"}
                      className={cn(tooExpensive && "opacity-70")}
                      onClick={() => {
                        const result = purchaseHat(hatId)
                        setFeedback(result.ok ? `${hat.name} открыт.` : result.reason ?? "Не удалось купить убор.")
                      }}
                    >
                      Buy
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant={hatId === "none" ? "secondary" : "primary"}
                      onClick={() => {
                        equipHat(hatId)
                        setFeedback(hatId === "none" ? "Brainy снова без убора." : `${hat.name} надет на Brainy.`)
                      }}
                    >
                      Equip
                    </Button>
                  )}

                  <span className={cn("text-xs", owned ? "text-[var(--success)]" : "text-soft")}>
                    {owned ? "Open" : "Lock"}
                  </span>
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>

      {feedback ? <div className="app-surface rounded-[24px] px-4 py-3 text-sm">{feedback}</div> : null}
    </div>
  )
}
