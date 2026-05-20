"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchLeaderboards } from "@/lib/supabase/data"
import { isSupabaseConfigured } from "@/lib/supabase/helpers"
import { formatCompactNumber, formatDuration } from "@/lib/utils/date"

interface LeaderboardState {
  progression: Array<{ display_name: string | null; total_xp: number; streak: number; city: string | null }>
  daily: Array<{
    id: string
    duration_ms: number
    mistakes: number
    xp_awarded: number
    created_at: string
    profiles?: { display_name: string | null; city: string | null } | null
  }>
}

export function Leaderboards() {
  const [state, setState] = useState<LeaderboardState | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    fetchLeaderboards(createClient())
      .then((payload) => {
        setLoadFailed(false)
        setState({
          progression: payload.progression ?? [],
          daily: (payload.daily ?? []).map((entry) => ({
            id: entry.id as string,
            duration_ms: entry.duration_ms as number,
            mistakes: entry.mistakes as number,
            xp_awarded: entry.xp_awarded as number,
            created_at: entry.created_at as string,
            profiles: Array.isArray(entry.profiles)
              ? (entry.profiles[0] as { display_name: string | null; city: string | null } | undefined) ?? null
              : (entry.profiles as { display_name: string | null; city: string | null } | null | undefined) ?? null
          }))
        })
      })
      .catch(() => {
        setLoadFailed(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const progression = state?.progression ?? []
  const daily = state?.daily ?? []

  if (!isSupabaseConfigured()) {
    return (
      <section className="app-surface rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">Leaderboard</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Рейтинг по XP</h1>
        <p className="mt-4 max-w-2xl text-base text-soft sm:text-lg">
          Подключи Supabase, чтобы показать реальный лидерборд игроков. Мок-данные здесь не используются.
        </p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="app-surface rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">Leaderboard</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Рейтинг по XP</h1>
        <p className="mt-4 text-base text-soft sm:text-lg">Загружаю реальные данные игроков…</p>
      </section>
    )
  }

  if (loadFailed) {
    return (
      <section className="app-surface rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">Leaderboard</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Рейтинг по XP</h1>
        <p className="mt-4 max-w-2xl text-base text-soft sm:text-lg">
          Не получилось загрузить leaderboard из Supabase. Проверь подключение и данные профилей.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="app-surface rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">Leaderboard</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Рейтинг по XP</h1>
        <p className="mt-3 max-w-2xl text-base text-soft sm:text-lg">
          Живой рейтинг игроков по общему XP и отдельная таблица по ежедневным попыткам.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="app-surface rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-soft">Global XP</p>
          <h2 className="mt-2 text-3xl font-semibold">Лучшие по прогрессу</h2>
          <div className="mt-6 space-y-3">
            {progression.length ? (
              progression.map((entry, index) => (
                <div key={`${entry.display_name}-${index}`} className="panel-surface flex items-center justify-between rounded-[24px] px-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] font-semibold text-[var(--accent)]">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{entry.display_name ?? "Anonymous"}</p>
                      <p className="text-sm text-soft">{entry.city ?? "Global"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCompactNumber(entry.total_xp)} XP</p>
                    <p className="text-sm text-soft">Streak {entry.streak}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="panel-surface rounded-[24px] px-4 py-6 text-soft">
                Пока нет игроков с XP в таблице.
              </div>
            )}
          </div>
        </section>

        <section className="app-surface rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-soft">Daily Challenge</p>
          <h2 className="mt-2 text-3xl font-semibold">Сегодняшнее время</h2>
          <div className="mt-6 space-y-3">
            {daily.length ? (
              daily.map((entry, index) => (
                <div key={entry.id} className="panel-surface flex items-center justify-between rounded-[24px] px-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] font-semibold text-[var(--accent)]">
                      #{index + 1}
                    </div>
                    {(() => {
                      const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
                      return (
                        <div>
                          <p className="font-medium">{profile?.display_name ?? "Daily Player"}</p>
                          <p className="text-sm text-soft">{profile?.city ?? "Global"}</p>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatDuration(entry.duration_ms)}</p>
                    <p className="text-sm text-soft">
                      {entry.mistakes} mistakes • {entry.xp_awarded} XP
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="panel-surface rounded-[24px] px-4 py-6 text-soft">
                Ещё нет завершённых daily attempts для таблицы.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
