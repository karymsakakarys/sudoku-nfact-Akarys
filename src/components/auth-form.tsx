"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppState } from "@/components/providers"

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

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { signIn, signUp, supabaseReady, authLoading, user } = useAppState()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const copy = modeCopy[mode]

  useEffect(() => {
    if (!user || authLoading) {
      return
    }

    setStatus("idle")
    setMessage("")
    router.replace("/profile")
    router.refresh()
  }, [authLoading, router, user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (user) {
      setStatus("idle")
      setMessage("")
      router.replace("/profile")
      router.refresh()
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
    const error =
      mode === "login" ? await signIn(email, password) : await signUp(email, password)

    if (error) {
      setStatus("error")
      setMessage(error)
      return
    }

    if (mode === "login") {
      setStatus("success")
      setMessage("")
      router.replace("/profile")
      router.refresh()
      return
    }

    setStatus("success")
    setMessage(copy.successMessage)
    router.replace("/profile")
    router.refresh()
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
            disabled={status === "submitting" || authLoading}
            className="primary-button w-full rounded-2xl px-4 py-3 font-medium disabled:opacity-70"
          >
            {status === "submitting" ? copy.loadingLabel : copy.submitLabel}
          </button>
        </form>

        <div className="mt-6 rounded-[28px] bg-[var(--reward)] p-5 text-sm text-soft">
          {!supabaseReady
            ? "Auth отключен, пока не заполнены переменные окружения Supabase."
            : "Аккаунт создается сразу через Supabase и после регистрации пользователь автоматически входит в приложение."}
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
              href={copy.alternateHref}
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
