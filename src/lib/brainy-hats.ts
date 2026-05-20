import { CSSProperties } from "react"
import { HatId } from "@/lib/types"

export interface HatDefinition {
  id: HatId
  name: string
  price: number
  assetPath: string | null
  accent: string
  overlayStyle?: CSSProperties
}

export const hatRegistry: Record<HatId, HatDefinition> = {
  none: {
    id: "none",
    name: "Без убора",
    price: 0,
    assetPath: null,
    accent: "rgba(122, 184, 86, 0.12)"
  },
  takia: {
    id: "takia",
    name: "Такия",
    price: 120,
    assetPath: "/hats/takia.png",
    accent: "rgba(103, 163, 255, 0.14)",
    overlayStyle: {
      width: "52%",
      left: "24%",
      top: "-2%",
      transform: "rotate(-4deg)"
    }
  },
  sombrero: {
    id: "sombrero",
    name: "Сомбреро",
    price: 180,
    assetPath: "/hats/sombrero.png",
    accent: "rgba(255, 189, 78, 0.16)",
    overlayStyle: {
      width: "82%",
      left: "9%",
      top: "-26%",
      transform: "rotate(-2deg)"
    }
  }
}

export const hatOrder: HatId[] = ["none", "takia", "sombrero"]
