"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { AnimatePresence, motion } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils/cn"

export function Sheet({
  open,
  onOpenChange,
  children
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  )
}

export const SheetTrigger = Dialog.Trigger
export const SheetTitle = Dialog.Title
export const SheetDescription = Dialog.Description
export const SheetClose = Dialog.Close

export function SheetPortal({ children }: { children: ReactNode }) {
  return <Dialog.Portal forceMount>{children}</Dialog.Portal>
}

export function SheetContent({
  open,
  className,
  children
}: {
  open: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <SheetPortal>
      <AnimatePresence>
        {open ? (
          <>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-[rgba(20,16,10,0.28)] backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className={cn(
                  "fixed inset-x-4 bottom-4 z-[60] rounded-[32px] border border-[var(--border-color)] bg-[var(--background-elevated)] p-5 shadow-[0_24px_80px_rgba(31,24,16,0.16)] backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:w-[420px]",
                  className
                )}
              >
                {children}
              </motion.div>
            </Dialog.Content>
          </>
        ) : null}
      </AnimatePresence>
    </SheetPortal>
  )
}
