"use client"

import {
  type CSSProperties,
  type ReactNode,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import {
  AppPlayerState,
  defaultAuthenticatedPlayerState,
  defaultPlayerState,
  getUserStateStorageKey,
  guestStateStorageKey,
  legacyLocalStateStorageKey,
  normalizeCampaignState,
  normalizePlayerState
} from "@/lib/app-state"
import { campaignNodes, createNextCampaignState, getNodeState, isNodeUnlocked } from "@/lib/campaign/nodes"
import { persistPlayerState, fetchProfileBundle, removeCloudSession, saveCloudSession, unlockTheme } from "@/lib/supabase/data"
import { createClient } from "@/lib/supabase/client"
import { getSupabaseRedirectUrl, isSupabaseConfigured } from "@/lib/supabase/helpers"
import { applyRewardToStats, calculateLevel, calculateReward, calculateSuperReward } from "@/lib/sudoku/rewards"
import { getThemeTokens } from "@/lib/theme/themes"
import {
  CampaignNodeState,
  Difficulty,
  HatId,
  MascotState,
  PersistedSession,
  RewardBreakdown,
  ThemeId,
  ThemeMode
} from "@/lib/types"
import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "@/lib/utils/storage"

interface AppContextValue {
  playerState: AppPlayerState
  user: User | null
  supabaseReady: boolean
  authLoading: boolean
  signOutInFlight: boolean
  logoutRedirecting: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  setThemeMode: (mode: ThemeMode) => void
  equipTheme: (themeId: ThemeId) => void
  purchaseTheme: (themeId: ThemeId) => { ok: boolean; reason?: string }
  equipHat: (hatId: HatId) => void
  purchaseHat: (hatId: HatId) => { ok: boolean; reason?: string }
  saveSession: (key: string, session: PersistedSession) => void
  loadSession: (key: string) => PersistedSession | null
  clearSession: (key: string) => void
  completeCampaignNode: (params: {
    nodeId: string
    difficulty: Difficulty
    elapsedMs: number
    mistakes: number
    completedAt: string
  }) => RewardBreakdown
  setMascotState: (state: MascotState) => void
  getCampaignNodeState: (nodeId: string) => CampaignNodeState
  isCampaignNodeUnlocked: (nodeId: string) => boolean
  isSuperLevelUnlocked: boolean
  completeSuperLevel: (params: {
    elapsedMs: number
    mistakes: number
    completedAt: string
  }) => RewardBreakdown
  recordCompletion: (params: {
    difficulty: Difficulty
    elapsedMs: number
    mistakes: number
    isDaily: boolean
    completedAt: string
  }) => RewardBreakdown
  updateProfile: (fields: Partial<Pick<AppPlayerState, "displayName" | "city" | "avatarSeed">>) => void
}

const AppContext = createContext<AppContextValue | null>(null)
const publicRoutes = ["/login", "/register", "/auth", "/auth/confirm", "/auth/error", "/leaderboard"]
const protectedRoutes = ["/profile"]

function getDateKey(input: string) {
  return input.slice(0, 10)
}

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function readStoredPlayerState(storageKey: string, fallback: AppPlayerState) {
  return normalizePlayerState(readLocalStorage<AppPlayerState | null>(storageKey, null), fallback)
}

function readGuestPlayerState() {
  const rawGuestState = readLocalStorage<AppPlayerState | null>(guestStateStorageKey, null)
  if (rawGuestState) {
    return normalizePlayerState(rawGuestState, defaultPlayerState)
  }

  const legacyState = readLocalStorage<AppPlayerState | null>(legacyLocalStateStorageKey, null)
  if (legacyState) {
    return normalizePlayerState(legacyState, defaultPlayerState)
  }

  return defaultPlayerState
}

function readUserPlayerState(userId: string) {
  return readStoredPlayerState(getUserStateStorageKey(userId), defaultAuthenticatedPlayerState)
}

function mergeLatestDate(a: string | null, b: string | null) {
  if (!a) {
    return b
  }
  if (!b) {
    return a
  }
  return a >= b ? a : b
}

function mergeBestTime(local: number | null, cloud: number | null) {
  if (local === null) {
    return cloud
  }
  if (cloud === null) {
    return local
  }
  return Math.min(local, cloud)
}

function applyDailyLoginStreak(
  state: AppPlayerState,
  awardedAt: string
) {
  const currentDate = awardedAt.slice(0, 10)
  const previousDate = state.stats.lastDailyCompletedAt?.slice(0, 10)

  if (previousDate === currentDate) {
    return state
  }

  return {
    ...state,
    stats: {
      ...state.stats,
      streak: Math.max(state.stats.streak, 0) + 1,
      dailyCompletions: state.stats.dailyCompletions + 1,
      lastDailyCompletedAt: awardedAt
    }
  }
}

function mergeCampaignState(localState: AppPlayerState["campaignState"], cloudState: AppPlayerState["campaignState"]) {
  const completedNodeIds = Array.from(
    new Set([...localState.completedNodeIds, ...cloudState.completedNodeIds])
  )
  const claimedChestIds = Array.from(
    new Set([...localState.claimedChestIds, ...cloudState.claimedChestIds])
  )
  const preferredCurrentNodeId =
    [localState.currentNodeId, cloudState.currentNodeId].find(
      (nodeId) => nodeId && !completedNodeIds.includes(nodeId)
    ) ??
    campaignNodes.find((node) => !completedNodeIds.includes(node.id))?.id ??
    localState.currentNodeId

  return normalizeCampaignState(
    {
      currentNodeId: preferredCurrentNodeId,
      completedNodeIds,
      claimedChestIds,
      lastCompletedNodeId: localState.lastCompletedNodeId ?? cloudState.lastCompletedNodeId,
      lastActiveDate: mergeLatestDate(localState.lastActiveDate, cloudState.lastActiveDate)
    },
    localState
  )
}

function buildPlayerStateFromCloud(
  bundle: Awaited<ReturnType<typeof fetchProfileBundle>>,
  fallbackState: AppPlayerState = defaultAuthenticatedPlayerState
) {
  if (!bundle.profile) {
    return fallbackState
  }

  const totalXp = Math.max(0, bundle.profile.total_xp)
  const mergedTotalXp = Math.max(fallbackState.stats.totalXp, totalXp)
  const cloudCampaignState = normalizeCampaignState(
    bundle.profile.campaign_state,
    fallbackState.campaignState
  )
  const mergedCampaignState = mergeCampaignState(fallbackState.campaignState, cloudCampaignState)
  const cloudSavedSessions = Object.fromEntries(
    bundle.sessions
      .map((entry) => [entry.session_key as string, entry.saved_state as PersistedSession])
      .filter((entry) => Boolean(entry[0] && entry[1]))
  )
  const bestTimes = {
    easy: mergeBestTime(fallbackState.stats.bestTimes.easy, bundle.profile.best_easy_ms),
    medium: mergeBestTime(fallbackState.stats.bestTimes.medium, bundle.profile.best_medium_ms),
    hard: mergeBestTime(fallbackState.stats.bestTimes.hard, bundle.profile.best_hard_ms),
    expert: mergeBestTime(fallbackState.stats.bestTimes.expert, bundle.profile.best_expert_ms)
  }

  return normalizePlayerState(
    {
      ...fallbackState,
      displayName: bundle.profile.display_name || fallbackState.displayName,
      city: bundle.profile.city || fallbackState.city,
      avatarSeed: bundle.profile.avatar_seed || fallbackState.avatarSeed,
      equippedTheme: bundle.profile.selected_theme || fallbackState.equippedTheme,
      ownedThemes: Array.from(new Set<ThemeId>(["base", ...bundle.themeUnlocks])),
      stats: {
        ...fallbackState.stats,
        totalXp: mergedTotalXp,
        level: calculateLevel(mergedTotalXp),
        coins: Math.max(fallbackState.stats.coins, Math.max(0, bundle.profile.coins)),
        streak: Math.max(fallbackState.stats.streak, Math.max(0, bundle.profile.streak)),
        gamesPlayed: Math.max(fallbackState.stats.gamesPlayed, Math.max(0, bundle.profile.games_played)),
        wins: Math.max(fallbackState.stats.wins, Math.max(0, bundle.profile.wins)),
        perfectClears: Math.max(
          fallbackState.stats.perfectClears,
          Math.max(0, bundle.profile.perfect_clears)
        ),
        dailyCompletions: Math.max(
          fallbackState.stats.dailyCompletions,
          Math.max(0, bundle.profile.daily_completions)
        ),
        lastDailyCompletedAt: mergeLatestDate(
          fallbackState.stats.lastDailyCompletedAt,
          bundle.profile.last_daily_completed_at
        ),
        bestTimes
      },
      campaignState: mergedCampaignState,
      savedSessions: {
        ...cloudSavedSessions,
        ...fallbackState.savedSessions
      }
    },
    fallbackState
  )
}

export function Providers({ children }: { children: ReactNode }) {
  const authorPreviewEmail = "author@sudokumindgarden.app"
  const pathname = usePathname()
  const router = useRouter()
  const routeIsPublic = isPublicRoute(pathname)
  const routeIsProtected = isProtectedRoute(pathname)
  const supabaseReady = isSupabaseConfigured()
  const [playerState, setPlayerState] = useState(defaultPlayerState)
  const [hydrated, setHydrated] = useState(false)
  const [authLoading, setAuthLoading] = useState(supabaseReady)
  const [signOutInFlight, setSignOutInFlight] = useState(false)
  const [logoutRedirecting, setLogoutRedirecting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [activeStorageKey, setActiveStorageKey] = useState(guestStateStorageKey)
  const [cloudHydratedUserId, setCloudHydratedUserId] = useState<string | null>(null)
  const streakClaimedRef = useRef<Set<string>>(new Set())
  const signOutInFlightRef = useRef(false)
  const isAuthorPreviewAccount = user?.email?.toLowerCase() === authorPreviewEmail

  function resetToGuestState() {
    setUser(null)
    setCloudHydratedUserId(null)
    setActiveStorageKey(guestStateStorageKey)
    setPlayerState(readGuestPlayerState())
    setAuthLoading(false)
  }

  useEffect(() => {
    if (!supabaseReady) {
      setPlayerState(readGuestPlayerState())
    }
    setHydrated(true)
  }, [supabaseReady])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    writeLocalStorage(activeStorageKey, playerState)

    if (activeStorageKey === guestStateStorageKey) {
      removeLocalStorage(legacyLocalStateStorageKey)
    }
  }, [activeStorageKey, hydrated, playerState])

  function awardLoginStreakOnce(baseState: AppPlayerState, userId: string, awardedAt: string) {
    const claimKey = `${userId}:${awardedAt.slice(0, 10)}`

    if (streakClaimedRef.current.has(claimKey)) {
      return baseState
    }

    streakClaimedRef.current.add(claimKey)
    return applyDailyLoginStreak(baseState, awardedAt)
  }

  useEffect(() => {
    if (!supabaseReady) {
      setAuthLoading(false)
      return
    }

    const supabase = createClient()
    let cancelled = false
    let initialAuthResolved = false

    const syncSignedOutState = () => {
      initialAuthResolved = true
      startTransition(() => {
        resetToGuestState()
      })
    }

    const syncSignedInState = async (nextUser: User) => {
      if (signOutInFlightRef.current) {
        return
      }

      const storageKey = getUserStateStorageKey(nextUser.id)
      const loginAwardedAt = new Date().toISOString()
      const bootstrapState = awardLoginStreakOnce(
        readUserPlayerState(nextUser.id),
        nextUser.id,
        loginAwardedAt
      )
      initialAuthResolved = true

      startTransition(() => {
        setUser(nextUser)
        setPlayerState(bootstrapState)
        setActiveStorageKey(storageKey)
        setCloudHydratedUserId(null)
        setAuthLoading(false)
      })

      try {
        const bundle = await fetchProfileBundle(supabase, nextUser.id)
        if (cancelled) {
          return
        }

        startTransition(() => {
          setUser(nextUser)
          setPlayerState((current) =>
            awardLoginStreakOnce(
              buildPlayerStateFromCloud(bundle, current),
              nextUser.id,
              loginAwardedAt
            )
          )
          setActiveStorageKey(storageKey)
          setCloudHydratedUserId(nextUser.id)
        })
      } catch {
        if (cancelled) {
          return
        }

        startTransition(() => {
          setCloudHydratedUserId(nextUser.id)
        })
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const sessionUser = data.session?.user
        if (signOutInFlightRef.current) {
          syncSignedOutState()
          return undefined
        }
        if (sessionUser) {
          return syncSignedInState(sessionUser)
        }

        syncSignedOutState()
        return undefined
      })
      .catch(() => {
        if (!cancelled) {
          syncSignedOutState()
        }
      })

    const initialAuthTimer = window.setTimeout(() => {
      if (!cancelled && !initialAuthResolved) {
        startTransition(() => {
          setAuthLoading(false)
        })
      }
    }, 4000)

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      try {
        if (signOutInFlightRef.current) {
          if (!session?.user) {
            syncSignedOutState()
          }
          return
        }

        if (session?.user) {
          await syncSignedInState(session.user)
          return
        }

        syncSignedOutState()
      } catch {
        if (!cancelled) {
          syncSignedOutState()
        }
      }
    })

    return () => {
      cancelled = true
      window.clearTimeout(initialAuthTimer)
      subscription.unsubscribe()
    }
  }, [supabaseReady])

  useEffect(() => {
    if (!hydrated || !supabaseReady || !user || cloudHydratedUserId !== user.id) {
      return
    }

    const timer = window.setTimeout(() => {
      persistPlayerState(createClient(), user.id, playerState).catch(() => undefined)
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [cloudHydratedUserId, hydrated, playerState, supabaseReady, user])

  useEffect(() => {
    if (!supabaseReady || authLoading || signOutInFlight || logoutRedirecting || !routeIsProtected) {
      return
    }

    if (!user) {
      const nextQuery = pathname.startsWith("/") ? `?next=${encodeURIComponent(pathname)}` : ""
      router.replace(`/login${nextQuery}`)
    }
  }, [authLoading, logoutRedirecting, pathname, routeIsProtected, router, signOutInFlight, supabaseReady, user])

  const value = useMemo<AppContextValue>(
    () => ({
      playerState,
      user,
      supabaseReady,
      authLoading,
      signOutInFlight,
      logoutRedirecting,
      async signIn(email, password) {
        if (!supabaseReady) {
          return "Добавь ключи Supabase в .env.local, чтобы включить вход."
        }

        setAuthLoading(true)

        try {
          const { data, error } = await createClient().auth.signInWithPassword({
            email,
            password
          })

          if (error) {
            setAuthLoading(false)

            if (
              error.message.includes("Invalid login credentials") ||
              error.message.includes("Email not confirmed")
            ) {
              return "Неверный email или пароль."
            }

            return error.message
          }

          if (!data.session) {
            setAuthLoading(false)
            return "Не удалось открыть сессию. Попробуй еще раз."
          }

          return null
        } catch {
          setAuthLoading(false)
          return "Не удалось войти. Проверь сеть и попробуй снова."
        }
      },
      async signUp(email, password) {
        if (!supabaseReady) {
          return "Добавь ключи Supabase в .env.local, чтобы включить регистрацию."
        }

        const supabase = createClient()
        setAuthLoading(true)

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: getSupabaseRedirectUrl("/auth/confirm?next=/profile"),
              data: {
                avatar_seed: "sudoku-wave"
              }
            }
          })

          if (error) {
            setAuthLoading(false)
            const message = error.message || "Не удалось создать аккаунт."

            if (
              message.includes("User already registered") ||
              message.includes("already been registered")
            ) {
              return "Пользователь с таким email уже существует."
            }

            if (message.includes("Password should be at least")) {
              return "Пароль должен содержать минимум 6 символов."
            }

            if (message.includes("Unable to validate email address")) {
              return "Укажи корректный email."
            }

            if (message.includes("email rate limit exceeded")) {
              return "Supabase пытается отправить письмо подтверждения и уперся в лимит. Отключи Confirm email или подожди немного."
            }

            return message
          }

          if (!data.session) {
            setAuthLoading(false)
            return "Аккаунт создан, но в Supabase включено подтверждение email. Отключи Confirm email, если нужен мгновенный вход."
          }

          return null
        } catch {
          setAuthLoading(false)
          return "Не удалось создать аккаунт. Проверь сеть и попробуй снова."
        }
      },
      async signOut() {
        if (!supabaseReady) {
          setLogoutRedirecting(true)
          startTransition(() => {
            resetToGuestState()
          })
          router.replace("/login")
          window.setTimeout(() => {
            setLogoutRedirecting(false)
          }, 0)
          return
        }

        signOutInFlightRef.current = true
        setSignOutInFlight(true)
        setLogoutRedirecting(true)

        startTransition(() => {
          resetToGuestState()
        })

        router.replace("/login")

        try {
          await fetch("/auth/logout", {
            method: "POST",
            credentials: "include",
            cache: "no-store"
          }).catch(() => undefined)

          await createClient().auth.signOut({
            scope: "local"
          }).catch(() => undefined)
        } finally {
          signOutInFlightRef.current = false
          setSignOutInFlight(false)
          resetToGuestState()
          setLogoutRedirecting(false)
        }
      },
      setThemeMode() {
        setPlayerState((current) => ({
          ...current,
          themeMode: "light"
        }))
      },
      equipTheme(themeId) {
        setPlayerState((current) => {
          if (!current.ownedThemes.includes(themeId)) {
            return current
          }
          return {
            ...current,
            equippedTheme: themeId
          }
        })
      },
      purchaseTheme(themeId) {
        if (playerState.ownedThemes.includes(themeId)) {
          return { ok: false, reason: "Тема уже куплена." }
        }

        const price = themeId === "ocean" ? 300 : 500
        if (playerState.stats.coins < price) {
          return { ok: false, reason: "Недостаточно coin-ов." }
        }

        setPlayerState((current) => ({
          ...current,
          ownedThemes: [...current.ownedThemes, themeId],
          stats: {
            ...current.stats,
            coins: current.stats.coins - price
          }
        }))

        if (supabaseReady && user) {
          unlockTheme(createClient(), user.id, themeId).catch(() => undefined)
        }

        return { ok: true }
      },
      equipHat(hatId) {
        setPlayerState((current) => {
          if (!current.ownedHats.includes(hatId)) {
            return current
          }

          return {
            ...current,
            equippedHat: hatId
          }
        })
      },
      purchaseHat(hatId) {
        if (hatId === "none") {
          return { ok: false, reason: "Этот вариант уже доступен." }
        }

        if (playerState.ownedHats.includes(hatId)) {
          return { ok: false, reason: "Убор уже куплен." }
        }

        const price = hatId === "takia" ? 120 : 180
        if (playerState.stats.coins < price) {
          return { ok: false, reason: "Недостаточно coin-ов." }
        }

        setPlayerState((current) => ({
          ...current,
          ownedHats: Array.from(new Set([...current.ownedHats, hatId])),
          stats: {
            ...current.stats,
            coins: current.stats.coins - price
          }
        }))

        return { ok: true }
      },
      saveSession(key, session) {
        setPlayerState((current) => ({
          ...current,
          savedSessions: {
            ...current.savedSessions,
            [key]: session
          }
        }))

        if (supabaseReady && user) {
          saveCloudSession(createClient(), user.id, key, session).catch(() => undefined)
        }
      },
      loadSession(key) {
        return playerState.savedSessions[key] ?? null
      },
      clearSession(key) {
        setPlayerState((current) => {
          const nextSessions = { ...current.savedSessions }
          delete nextSessions[key]
          return {
            ...current,
            savedSessions: nextSessions
          }
        })

        if (supabaseReady && user) {
          removeCloudSession(createClient(), user.id, key).catch(() => undefined)
        }
      },
      isSuperLevelUnlocked: true,
      completeCampaignNode(params) {
        const reward = calculateReward({
          difficulty: params.difficulty,
          elapsedMs: params.elapsedMs,
          mistakes: params.mistakes
        })

        setPlayerState((current) => {
          const nextCampaignState = createNextCampaignState(
            current.campaignState,
            params.nodeId,
            getDateKey(params.completedAt)
          )
          const nextStats = applyRewardToStats(current.stats, reward, {
            difficulty: params.difficulty,
            elapsedMs: params.elapsedMs,
            mistakes: params.mistakes,
            isDaily: false,
            completedAt: params.completedAt
          })

          return {
            ...current,
            mascotState: "celebrating",
            campaignState: nextCampaignState,
            stats: nextStats
          }
        })

        return reward
      },
      completeSuperLevel(params) {
        const reward = calculateSuperReward({
          elapsedMs: params.elapsedMs,
          mistakes: params.mistakes
        })

        setPlayerState((current) => ({
          ...current,
          mascotState: "celebrating",
          superLevel: {
            completedAt: params.completedAt,
            bestTimeMs:
              current.superLevel.bestTimeMs === null
                ? params.elapsedMs
                : Math.min(current.superLevel.bestTimeMs, params.elapsedMs),
            timesCompleted: current.superLevel.timesCompleted + 1
          },
          stats: {
            ...current.stats,
            totalXp: current.stats.totalXp + reward.xp,
            level: calculateLevel(current.stats.totalXp + reward.xp),
            coins: current.stats.coins + reward.coins,
            gamesPlayed: current.stats.gamesPlayed + 1,
            wins: current.stats.wins + 1,
            perfectClears: current.stats.perfectClears + (params.mistakes === 0 ? 1 : 0)
          }
        }))

        return reward
      },
      setMascotState(state) {
        setPlayerState((current) => ({
          ...current,
          mascotState: state
        }))
      },
      getCampaignNodeState(nodeId) {
        const node = campaignNodes.find((entry) => entry.id === nodeId)
        if (!node) {
          return "locked"
        }
        if (isAuthorPreviewAccount) {
          return node.id === playerState.campaignState.currentNodeId ? "current" : "open"
        }
        return getNodeState(node, playerState.campaignState)
      },
      isCampaignNodeUnlocked(nodeId) {
        const node = campaignNodes.find((entry) => entry.id === nodeId)
        if (!node) {
          return false
        }
        if (isAuthorPreviewAccount) {
          return true
        }
        return isNodeUnlocked(node, playerState.campaignState)
      },
      recordCompletion(params) {
        const reward = calculateReward(params)
        setPlayerState((current) => ({
          ...current,
          stats: applyRewardToStats(current.stats, reward, params)
        }))
        return reward
      },
      updateProfile(fields) {
        setPlayerState((current) => ({
          ...current,
          ...fields
        }))
      }
    }),
    [authLoading, isAuthorPreviewAccount, logoutRedirecting, playerState, router, signOutInFlight, supabaseReady, user]
  )

  const themeTokens = getThemeTokens(playerState.equippedTheme, "light")
  const shouldBlockProtectedRoute =
    supabaseReady && authLoading && routeIsProtected && !signOutInFlight && !logoutRedirecting && !routeIsPublic

  return (
    <AppContext.Provider value={value}>
      <div
        className={`min-h-screen ${playerState.equippedTheme === "ocean" ? "theme-ocean" : ""} ${
          playerState.equippedTheme === "sunnyBlue" ? "theme-sunnyBlue" : ""
        }`}
        style={themeTokens as CSSProperties}
      >
        {shouldBlockProtectedRoute ? (
          <div className="flex min-h-screen items-center justify-center px-6">
            <div className="app-surface max-w-md rounded-[32px] px-6 py-8 text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-soft">Session</p>
              <h1 className="mt-3 text-2xl font-semibold">Восстанавливаем аккаунт</h1>
              <p className="mt-3 text-soft">
                Возвращаем твой облачный профиль и прогресс, чтобы не переключаться на локальный guest-state.
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </AppContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppState must be used inside Providers")
  }
  return context
}
