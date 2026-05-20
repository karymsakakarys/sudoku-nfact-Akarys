"use client"

import { FormEvent, useState } from "react"
import { Flame, UserRound } from "lucide-react"
import { Mascot } from "@/components/mascot"
import { useAppState } from "@/components/providers"
import { formatCompactNumber } from "@/lib/utils/date"

export function ProfileOverview() {
  const { playerState, user, authLoading, supabaseReady, updateProfile, signOut } = useAppState()
  const [displayName, setDisplayName] = useState(playerState.displayName)
  const [city, setCity] = useState(playerState.city)
  const signOutBusy = authLoading && !user

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateProfile({
      displayName: displayName.trim() || playerState.displayName,
      city: city.trim()
    })
  }

  async function handleSignOut() {
    await signOut()
    window.location.replace("/login")
  }

  return (
    <div className="space-y-5">
      <section className="profile-hero">
        <Mascot state={playerState.mascotState} size={112} />
        <div>
          <p className="map-brow">Profile</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="chrome-section-icon">
              <UserRound className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <h1 className="text-3xl font-semibold">{playerState.displayName}</h1>
          </div>
          <p className="mt-1 text-soft">Cloud sync on</p>
        </div>
      </section>

      <section className="profile-streak-card">
        <div className="profile-streak-icon">
          <Flame className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div>
          <p className="map-brow">Streak</p>
          <p className="mt-2 text-3xl font-semibold">{playerState.stats.streak}</p>
          <p className="mt-1 text-sm text-soft">Одна победа в день поддерживает огонь.</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="profile-stat-card">
          <span>XP</span>
          <strong>{formatCompactNumber(playerState.stats.totalXp)}</strong>
        </div>
        <div className="profile-stat-card">
          <span>Coins</span>
          <strong>{formatCompactNumber(playerState.stats.coins)}</strong>
        </div>
        <div className="profile-stat-card">
          <span>Theme</span>
          <strong>{playerState.equippedTheme}</strong>
        </div>
      </section>

      <section className="app-surface rounded-[30px] p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="panel-surface block rounded-[22px] p-4">
            <span className="text-xs uppercase tracking-[0.22em] text-soft">Name</span>
            <input
              className="mt-2 w-full bg-transparent text-lg outline-none"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <label className="panel-surface block rounded-[22px] p-4">
            <span className="text-xs uppercase tracking-[0.22em] text-soft">City</span>
            <input
              className="mt-2 w-full bg-transparent text-lg outline-none"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </label>
          <button type="submit" className="primary-button w-full rounded-full px-4 py-3 text-sm font-semibold">
            Сохранить
          </button>
        </form>

        <div className="mt-4 rounded-[22px] bg-[var(--reward)] px-4 py-4 text-sm text-soft">
          {supabaseReady
            ? "Прогресс, темы и сохранения синхронизируются с аккаунтом."
            : "Заполни переменные окружения Supabase, чтобы включить аккаунт и облачную синхронизацию."}
        </div>

        {supabaseReady ? (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signOutBusy}
            className="secondary-button mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-70"
          >
            {signOutBusy ? "Проверяем сессию..." : "Выйти"}
          </button>
        ) : null}
      </section>
    </div>
  )
}
