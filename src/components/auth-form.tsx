"use client"

import Link from "next/link"
import { FormEvent, useEffect, useRef, useState } from "react"
import { useAppState } from "@/components/providers"
import { createClient } from "@/lib/supabase/client"

type AuthMode = "login" | "register"

const modeCopy: Record<
  AuthMode,
  {
    eyebrow: string
    title: string
    description: string
    submitLabel: string
    loadingLabel: string
    alternateLabel: string
    alternateHref: string
    alternateCta: string
    successMessage: string
  }
> = {
  login: {
    eyebrow: "Sign In",
    title: "Вход в Sudoku Mind Garden",
    description: "Войди в аккаунт, чтобы открыть прогресс, синхронизацию и leaderboard.",
    submitLabel: "Войти",
    loadingLabel: "Входим...",
    alternateLabel: "Еще нет аккаунта?",
    alternateHref: "/register",
    alternateCta: "Создать аккаунт",
    successMessage: ""
  },
  register: {
    eyebrow: "Sign Up",
    title: "Регистрация в Sudoku Mind Garden",
    description: "Создай аккаунт, чтобы сохранить прогресс, темы и ежедневные достижения в облаке.",
    submitLabel: "Создать аккаунт",
    loadingLabel: "Создаем аккаунт...",
    alternateLabel: "Уже есть аккаунт?",
    alternateHref: "/login",
    alternateCta: "Перейти ко входу",
    successMessage: ""
  }
}

export function AuthForm({
  mode,
  nextPath = "/profile"
}: {
  mode: AuthMode
  nextPath?: string
}) {
  const authorPreviewEmail = "author@sudokumindgarden.app"
  const authorPreviewPassword = "Preview123!"
  const { signIn, signUp, supabaseReady, authLoading, signOutInFlight, user } = useAppState()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [resolvedNextPath, setResolvedNextPath] = useState(
    nextPath.startsWith("/") ? nextPath : "/profile"
  )
  const hasNavigatedRef = useRef(false)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const copy = modeCopy[mode]
  const normalizedNextPath = resolvedNextPath.startsWith("/") ? resolvedNextPath : "/profile"
  const alternateHref =
    normalizedNextPath !== "/profile"
      ? `${copy.alternateHref}?next=${encodeURIComponent(normalizedNextPath)}`
      : copy.alternateHref

  async function waitForConfirmedSession(timeoutMs = 8000) {
    const startedAt = Date.now()
    const supabase = createClient()

    while (Date.now() - startedAt < timeoutMs) {
      const { data } = await supabase.auth.getSession()

      if (data.session?.user) {
        return true
      }

      await new Promise((resolve) => window.setTimeout(resolve, 250))
    }

    return false
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const candidate = params.get("next")

    if (candidate?.startsWith("/")) {
      setResolvedNextPath(candidate)
      return
    }

    setResolvedNextPath(nextPath.startsWith("/") ? nextPath : "/profile")
  }, [nextPath])

  useEffect(() => {
    if (!user || authLoading || signOutInFlight || status === "submitting") {
      return
    }

    if (hasNavigatedRef.current) {
      return
    }

    hasNavigatedRef.current = true
    setStatus("idle")
    setMessage("")
    window.location.replace(normalizedNextPath)
  }, [authLoading, normalizedNextPath, signOutInFlight, status, user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (user) {
      hasNavigatedRef.current = true
      setStatus("idle")
      setMessage("")
      window.location.replace(normalizedNextPath)
      return
    }

    if (!supabaseReady) {
      setStatus("error")
      setMessage(
        "Добавь NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY и NEXT_PUBLIC_APP_URL в .env.local."
      )
      return
    }

    setStatus("submitting")
    const authPromise = mode === "login" ? signIn(email, password) : signUp(email, password)
    const sessionWatcher = waitForConfirmedSession()
    const firstResult = await Promise.race([
      authPromise.then((error) => ({ type: "auth" as const, error })),
      sessionWatcher.then((confirmed) => ({ type: "session" as const, confirmed }))
    ])

    if (firstResult.type === "session" && firstResult.confirmed) {
      hasNavigatedRef.current = true
      setStatus("success")
      setMessage(copy.successMessage)
      window.location.assign(normalizedNextPath)
      return
    }

    const error =
      firstResult.type === "auth" ? firstResult.error : await authPromise

    if (error) {
      setStatus("error")
      setMessage(error)
      return
    }

    hasNavigatedRef.current = true
    setStatus("success")
    setMessage(copy.successMessage)
    window.location.assign(normalizedNextPath)
  }

  function handleAuthorPreviewFill() {
    setEmail(authorPreviewEmail)
    setPassword(authorPreviewPassword)
    setStatus("idle")
    setMessage("")

    window.requestAnimationFrame(() => {
      passwordInputRef.current?.focus()
      passwordInputRef.current?.setSelectionRange(
        authorPreviewPassword.length,
        authorPreviewPassword.length
      )
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="app-surface rounded-[36px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">{copy.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-soft">{copy.description}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="panel-surface block rounded-[24px] p-4">
            <span className="text-xs uppercase tracking-[0.2em] text-soft">Email</span>
            <input
              ref={emailInputRef}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-3 w-full bg-transparent text-lg outline-none"
            />
          </label>
          <label className="panel-surface block rounded-[24px] p-4">
            <span className="text-xs uppercase tracking-[0.2em] text-soft">Password</span>
            <input
              ref={passwordInputRef}
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Минимум 6 символов"
              className="mt-3 w-full bg-transparent text-lg outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="primary-button w-full rounded-2xl px-4 py-3 font-medium disabled:opacity-70"
          >
            {status === "submitting" ? copy.loadingLabel : copy.submitLabel}
          </button>
          {mode === "login" ? (
            <button
              type="button"
              onClick={handleAuthorPreviewFill}
              disabled={status === "submitting"}
              className="author-preview-button w-full rounded-2xl px-4 py-3 font-medium disabled:opacity-70"
            >
              Аккаунт автора
            </button>
          ) : null}
        </form>

        <div className="mt-6 rounded-[28px] bg-[var(--reward)] p-5 text-sm text-soft">
          {!supabaseReady
            ? "Auth отключен, пока не заполнены переменные окружения Supabase."
            : "Для мгновенной регистрации в Supabase должно быть выключено Confirm email: Authentication -> Providers -> Email."}
        </div>

        {message ? (
          <p
            className={`mt-4 text-sm ${
              status === "error" ? "text-[var(--danger)]" : "text-[var(--accent)]"
            }`}
          >
            {message}
          </p>
        ) : null}

        {user ? (
          <p className="mt-4 text-sm text-soft">
            Сессия уже активна. Открой{" "}
            <Link href="/profile" className="font-medium text-[var(--accent)] underline-offset-4 hover:underline">
              профиль
            </Link>
            .
          </p>
        ) : (
          <p className="mt-5 text-sm text-soft">
            {copy.alternateLabel}{" "}
            <Link
              href={alternateHref}
              className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {copy.alternateCta}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
