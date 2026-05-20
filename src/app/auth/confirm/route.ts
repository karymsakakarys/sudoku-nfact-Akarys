import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/helpers"

export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.clone()

  if (!isSupabaseConfigured()) {
    redirectTo.pathname = "/login"
    redirectTo.searchParams.set("setup", "missing")
    return NextResponse.redirect(redirectTo)
  }

  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/profile"

  redirectTo.pathname = next.startsWith("/") ? next : "/profile"
  redirectTo.searchParams.delete("token_hash")
  redirectTo.searchParams.delete("type")
  redirectTo.searchParams.delete("next")

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type
    })

    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  redirectTo.pathname = "/auth/error"
  return NextResponse.redirect(redirectTo)
}
