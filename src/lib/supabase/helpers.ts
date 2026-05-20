export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}

export function getSupabaseRedirectUrl(path = "/auth/confirm") {
  const browserOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : null
  const origin =
    browserOrigin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  return `${origin}${path}`
}
