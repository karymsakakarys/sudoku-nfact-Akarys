import { SupabaseClient } from "@supabase/supabase-js"
import { AppPlayerState } from "@/lib/app-state"
import { CloudProfile, PersistedSession, ThemeId } from "@/lib/types"

export async function fetchProfileBundle(
  supabase: SupabaseClient,
  userId: string
) {
  const [{ data: profileRaw }, { data: themeUnlocks }, { data: sessions }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("theme_unlocks").select("theme_id").eq("user_id", userId),
      supabase.from("game_sessions").select("session_key,saved_state").eq("user_id", userId)
    ])

  return {
    profile: (profileRaw as CloudProfile | null) ?? null,
    themeUnlocks:
      themeUnlocks?.map((entry) => entry.theme_id as ThemeId).filter(Boolean) ?? [],
    sessions: sessions ?? []
  }
}

export async function persistPlayerState(
  supabase: SupabaseClient,
  userId: string,
  state: AppPlayerState
) {
  await supabase.from("profiles").upsert({
    id: userId,
    display_name: state.displayName,
    avatar_seed: state.avatarSeed,
    total_xp: state.stats.totalXp,
    coins: state.stats.coins,
    streak: state.stats.streak,
    games_played: state.stats.gamesPlayed,
    wins: state.stats.wins,
    perfect_clears: state.stats.perfectClears,
    daily_completions: state.stats.dailyCompletions,
    best_easy_ms: state.stats.bestTimes.easy,
    best_medium_ms: state.stats.bestTimes.medium,
    best_hard_ms: state.stats.bestTimes.hard,
    best_expert_ms: state.stats.bestTimes.expert,
    last_daily_completed_at: state.stats.lastDailyCompletedAt,
    selected_theme: state.equippedTheme,
    city: state.city,
    campaign_state: state.campaignState
  })
}

export async function unlockTheme(
  supabase: SupabaseClient,
  userId: string,
  themeId: ThemeId
) {
  return supabase.from("theme_unlocks").upsert(
    {
      user_id: userId,
      theme_id: themeId
    },
    {
      onConflict: "user_id,theme_id"
    }
  )
}

export async function saveCloudSession(
  supabase: SupabaseClient,
  userId: string,
  sessionKey: string,
  session: PersistedSession
) {
  return supabase.from("game_sessions").upsert(
    {
      user_id: userId,
      session_key: sessionKey,
      mode: session.mode,
      difficulty: session.difficulty,
      elapsed_ms: session.elapsedMs,
      mistakes: session.mistakes,
      hints_used: session.hintsUsed,
      completed_at: session.completedAt ?? null,
      saved_state: session
    },
    {
      onConflict: "user_id,session_key"
    }
  )
}

export async function removeCloudSession(
  supabase: SupabaseClient,
  userId: string,
  sessionKey: string
) {
  return supabase
    .from("game_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("session_key", sessionKey)
}

export async function fetchLeaderboards(supabase: SupabaseClient) {
  const [{ data: progression }, { data: daily }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,total_xp,streak,city")
      .order("total_xp", { ascending: false })
      .limit(10),
    supabase
      .from("daily_attempts")
      .select("id,duration_ms,mistakes,xp_awarded,created_at,profiles(display_name,city)")
      .order("duration_ms", { ascending: true })
      .order("mistakes", { ascending: true })
      .limit(10)
  ])

  return {
    progression: progression ?? [],
    daily: daily ?? []
  }
}
