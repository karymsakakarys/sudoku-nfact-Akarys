import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

type CookieWrite = {
  name: string
  value: string
  options?: Record<string, unknown>
}

async function signOutWithServerClient() {
  const cookieStore = await cookies()
  const response = NextResponse.json({ ok: true }, { status: 200 })

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

export async function POST() {
  return signOutWithServerClient()
}

export async function GET(request: Request) {
  const signOutResponse = await signOutWithServerClient()
  const loginUrl = new URL("/login", request.url)
  const redirect = NextResponse.redirect(loginUrl)

  signOutResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie)
  })

  return redirect
}
