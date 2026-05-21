"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchLeaderboards } from "@/lib/supabase/data"
import { isSupabaseConfigured } from "@/lib/supabase/helpers"
import { formatCompactNumber } from "@/lib/utils/date"

interface LeaderboardState {
  progression: Array<{ display_name: string | null; total_xp: number; streak: number; city: string | null }>
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
          progression: payload.progression ?? []
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

  if (!isSupabaseConfigured()) {
    return (
      <section className="app-surface rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">Global XP</p>
        <h1 className="mt-2 text-3xl font-semibold">Лучшие по прогрессу</h1>
        <p className="mt-4 max-w-2xl text-base text-soft">
          Подключи Supabase, чтобы показать реальный лидерборд игроков. Мок-данные здесь не используются.
        </p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="app-surface rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">Global XP</p>
        <h1 className="mt-2 text-3xl font-semibold">Лучшие по прогрессу</h1>
        <p className="mt-4 text-base text-soft">Загружаю реальные данные игроков…</p>
      </section>
    )
  }

  if (loadFailed) {
    return (
      <section className="app-surface rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">Global XP</p>
        <h1 className="mt-2 text-3xl font-semibold">Лучшие по прогрессу</h1>
        <p className="mt-4 max-w-2xl text-base text-soft">
          Не получилось загрузить leaderboard из Supabase. Проверь подключение и данные профилей.
        </p>
      </section>
    )
  }

  return (
    <section className="app-surface rounded-[32px] p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.24em] text-soft">Global XP</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Лучшие по прогрессу</h1>
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
  )
}
