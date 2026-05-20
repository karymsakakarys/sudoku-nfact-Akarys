"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Crown, Map as MapIcon, ShoppingBag, Trophy, UserRound } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils/cn"

const navItems = [
  { href: "/", label: "Карта", icon: MapIcon },
  { href: "/super-level", label: "Супер уровень", icon: Crown, special: true },
  { href: "/leaderboard", label: "XP", icon: Trophy },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: UserRound }
]

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isPlayRoute = pathname.startsWith("/play/")
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/")

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-32 pt-6 sm:px-6 sm:pt-8">
      <motion.main
        key={pathname}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex-1"
      >
        {children}
      </motion.main>

      <nav
        className={cn(
          "app-surface chrome-bottom-nav fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[36rem] -translate-x-1/2 items-center justify-between rounded-[30px] px-3 py-2",
          (isPlayRoute || isAuthRoute) && "hidden"
        )}
      >
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "chrome-tab rounded-[22px] px-3 py-2 text-xs transition-colors",
                active ? "is-active text-[var(--accent)]" : "text-soft",
                item.special && "is-special"
              )}
            >
              <span className="flex min-w-[5.2rem] flex-col items-center gap-1">
                <Icon className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
                <span>{item.label}</span>
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
