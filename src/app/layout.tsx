import type { Metadata } from "next"
import type { ReactNode } from "react"
import "@/app/globals.css"
import { AppChrome } from "@/components/app-chrome"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "Sudoku Mind Garden",
  description: "Премиальная Sudoku-платформа с daily challenge, AI Coach, XP и темами."
}

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  )
}
