"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/helpers"

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export default function AuthContinuePage() {
  const [status, setStatus] = useState<"checking" | "error">("checking")
  const [message, setMessage] = useState("Завершаем вход и синхронизируем защищенную сессию.")
  const nextPath = useMemo(() => {
    if (typeof window === "undefined") {
      return "/profile"
    }

    const candidate = new URLSearchParams(window.location.search).get("next")
    return candidate?.startsWith("/") ? candidate : "/profile"
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      window.location.replace(nextPath)
      return
    }

    let cancelled = false

    const completeLogin = async () => {
      const supabase = createClient()
      const startedAt = Date.now()

      while (!cancelled && Date.now() - startedAt < 12000) {
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session?.user) {
          await sleep(250)
          continue
        }

        try {
          const response = await fetch("/auth/session", {
            method: "GET",
            credentials: "include",
            cache: "no-store"
          })

          if (response.ok) {
            window.location.replace(nextPath)
            return
          }
        } catch {
          // Keep polling for a short period while SSR cookies catch up.
        }

        await sleep(250)
      }

      if (!cancelled) {
        setStatus("error")
        setMessage("Сессия подтвердилась не до конца. Нажми повторить или вернись ко входу.")
      }
    }

    void completeLogin()

    return () => {
      cancelled = true
    }
  }, [nextPath])

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
      <div className="app-surface w-full rounded-[36px] p-6 text-center sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">Session</p>
        <h1 className="mt-3 text-3xl font-semibold">
          {status === "checking" ? "Завершаем вход..." : "Нужна еще одна попытка"}
        </h1>
        <p className="mt-3 text-soft">{message}</p>

        {status === "error" ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="primary-button rounded-2xl px-5 py-3 font-medium"
            >
              Повторить
            </button>
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="author-preview-button rounded-2xl px-5 py-3 font-medium text-center"
            >
              Вернуться ко входу
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
