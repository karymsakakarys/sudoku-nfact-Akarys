export function getUtcDateKey(input = new Date()) {
  const year = input.getUTCFullYear()
  const month = `${input.getUTCMonth() + 1}`.padStart(2, "0")
  const day = `${input.getUTCDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value)
}

