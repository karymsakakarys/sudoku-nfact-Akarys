import { type NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"
import { isSupabaseConfigured } from "@/lib/supabase/helpers"

const publicRoutes = ["/login", "/register", "/auth", "/auth/confirm", "/auth/error"]

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({
      request
    })
  }

  const { response, hasSession } = await updateSession(request)
  const pathname = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  const nextPath = `${pathname}${request.nextUrl.search}`

  if (!hasSession && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", nextPath)
    return NextResponse.redirect(loginUrl)
  }

  if (hasSession && (pathname === "/login" || pathname === "/register" || pathname === "/auth")) {
    const profileUrl = request.nextUrl.clone()
    profileUrl.pathname = "/profile"
    profileUrl.searchParams.delete("next")
    return NextResponse.redirect(profileUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
}
