import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/helpers"

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ready: false, reason: "supabase_not_configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return NextResponse.json(
    { ready: Boolean(user) },
    {
      status: user ? 200 : 401,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  )
}
