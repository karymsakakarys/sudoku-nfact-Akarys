import { CampaignNode, CampaignState, CampaignTier } from "@/lib/types"

export const campaignNodes: CampaignNode[] = [
  {
    id: "sprout-1",
    order: 1,
    kind: "puzzle",
    tier: "green",
    difficulty: "easy",
    seed: "sprout-1-seed",
    title: "1",
    gridLabel: "01",
    mapX: 50,
    mapY: 86
  },
  {
    id: "sprout-2",
    order: 2,
    kind: "puzzle",
    tier: "green",
    difficulty: "easy",
    seed: "sprout-2-seed",
    title: "2",
    gridLabel: "02",
    mapX: 29,
    mapY: 76
  },
  {
    id: "sprout-3",
    order: 3,
    kind: "puzzle",
    tier: "green",
    difficulty: "easy",
    seed: "sprout-3-seed",
    title: "3",
    gridLabel: "03",
    mapX: 67,
    mapY: 68
  },
  {
    id: "logic-1",
    order: 4,
    kind: "puzzle",
    tier: "yellow",
    difficulty: "medium",
    seed: "logic-1-seed",
    title: "4",
    gridLabel: "04",
    mapX: 37,
    mapY: 60
  },
  {
    id: "logic-2",
    order: 5,
    kind: "puzzle",
    tier: "yellow",
    difficulty: "medium",
    seed: "logic-2-seed",
    title: "5",
    gridLabel: "05",
    mapX: 69,
    mapY: 52
  },
  {
    id: "logic-3",
    order: 6,
    kind: "puzzle",
    tier: "yellow",
    difficulty: "medium",
    seed: "logic-3-seed",
    title: "6",
    gridLabel: "06",
    mapX: 33,
    mapY: 44
  },
  {
    id: "focus-1",
    order: 7,
    kind: "puzzle",
    tier: "orange",
    difficulty: "hard",
    seed: "focus-1-seed",
    title: "7",
    gridLabel: "07",
    mapX: 66,
    mapY: 36
  },
  {
    id: "focus-2",
    order: 8,
    kind: "puzzle",
    tier: "orange",
    difficulty: "hard",
    seed: "focus-2-seed",
    title: "8",
    gridLabel: "08",
    mapX: 38,
    mapY: 28
  },
  {
    id: "focus-3",
    order: 9,
    kind: "puzzle",
    tier: "orange",
    difficulty: "hard",
    seed: "focus-3-seed",
    title: "9",
    gridLabel: "09",
    mapX: 68,
    mapY: 20
  },
  {
    id: "master-1",
    order: 10,
    kind: "puzzle",
    tier: "violet",
    difficulty: "expert",
    seed: "master-1-seed",
    title: "10",
    gridLabel: "10",
    mapX: 44,
    mapY: 12
  },
  {
    id: "master-2",
    order: 11,
    kind: "puzzle",
    tier: "violet",
    difficulty: "expert",
    seed: "master-2-seed",
    title: "11",
    gridLabel: "11",
    mapX: 63,
    mapY: 6
  },
  {
    id: "master-3",
    order: 12,
    kind: "puzzle",
    tier: "violet",
    difficulty: "expert",
    seed: "master-3-seed",
    title: "12",
    gridLabel: "12",
    mapX: 35,
    mapY: 1
  }
]

export const campaignTierColors: Record<
  CampaignTier,
  { shell: string; glow: string; soft: string; text: string }
> = {
  green: {
    shell: "#79c35a",
    glow: "rgba(121, 195, 90, 0.38)",
    soft: "rgba(121, 195, 90, 0.20)",
    text: "#2f6e22"
  },
  yellow: {
    shell: "#f0bb4f",
    glow: "rgba(240, 187, 79, 0.34)",
    soft: "rgba(240, 187, 79, 0.18)",
    text: "#8a5f13"
  },
  orange: {
    shell: "#ee8b4f",
    glow: "rgba(238, 139, 79, 0.34)",
    soft: "rgba(238, 139, 79, 0.18)",
    text: "#8b4519"
  },
  violet: {
    shell: "#8f79ee",
    glow: "rgba(143, 121, 238, 0.36)",
    soft: "rgba(143, 121, 238, 0.20)",
    text: "#4f3d9e"
  }
}

export function getCurrentCampaignNode(state?: CampaignState | null) {
  return (
    campaignNodes.find((node) => node.id === state?.currentNodeId) ??
    campaignNodes.find((node) => !state?.completedNodeIds?.includes(node.id)) ??
    campaignNodes[0]
  )
}

export function getNextPlayableNodeId(completedNodeIds: string[]) {
  const nextNode = campaignNodes.find((node) => !completedNodeIds.includes(node.id))
  return nextNode?.id ?? null
}

export function isNodeUnlocked(node: CampaignNode, state?: CampaignState | null) {
  if (state?.completedNodeIds?.includes(node.id)) {
    return true
  }

  return node.id === state?.currentNodeId
}

export function getNodeState(node: CampaignNode, state?: CampaignState | null) {
  if (state?.completedNodeIds?.includes(node.id)) {
    return "completed" as const
  }

  if (node.id === state?.currentNodeId) {
    return "current" as const
  }

  return "locked" as const
}

export function createNextCampaignState(
  state: CampaignState,
  completedNodeId: string,
  completedAtDate: string
): CampaignState {
  const completedNodeIds = Array.from(new Set([...state.completedNodeIds, completedNodeId]))
  const nextPlayableNodeId = getNextPlayableNodeId(completedNodeIds)

  return {
    currentNodeId: nextPlayableNodeId ?? state.currentNodeId,
    completedNodeIds,
    claimedChestIds: state.claimedChestIds,
    lastCompletedNodeId: completedNodeId,
    lastActiveDate: completedAtDate
  }
}
