import { PlayScreen } from "@/components/play-screen"

export default async function CampaignNodePage({
  params
}: {
  params: Promise<{ nodeId: string }>
}) {
  const { nodeId } = await params
  return <PlayScreen nodeId={nodeId} />
}
