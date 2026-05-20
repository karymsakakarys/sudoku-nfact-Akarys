import { createBrowserClient } from "@supabase/ssr"

let clientSingleton:
  | ReturnType<typeof createBrowserClient>
  | null = null

export function createClient() {
  if (clientSingleton) {
    return clientSingleton
  }

  clientSingleton = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  return clientSingleton
}

