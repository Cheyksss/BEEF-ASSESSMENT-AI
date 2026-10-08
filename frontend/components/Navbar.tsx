"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Sparkles, History, LogOut } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuthContext()

  // Do not show full navbar on /login
  if (pathname === "/login") {
    return null
  }

  const navLinks = [
    { href: "/assess", label: "Analysis", icon: Sparkles },
    { href: "/history", label: "History", icon: History },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Navigation Links - Analysis & History */}
        <nav className="flex items-center gap-1.5 bg-muted/50 p-1.5 rounded-xl border border-border/50 text-xs font-semibold">
          {navLinks.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                  active
                    ? "bg-background text-foreground shadow-sm font-bold text-red-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
