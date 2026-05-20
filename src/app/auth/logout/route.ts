import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

type CookieWrite = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const loginUrl = new URL("/login", request.url)
  const response = NextResponse.redirect(loginUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieWrite[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  await supabase.auth.signOut()

  return response
}
