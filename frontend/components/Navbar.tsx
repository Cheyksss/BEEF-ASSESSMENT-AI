"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Beef, LayoutDashboard, Sparkles, History, LogOut, User } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuthContext()

  // Do not show full navbar on /login
  if (pathname === "/login") {
    return null
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assess", label: "Assess Cut", icon: Sparkles },
    { href: "/history", label: "History", icon: History },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <Beef className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight leading-tight text-foreground">
              MeatScan<span className="text-red-600">AI</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Quality Core
            </span>
          </div>
        </Link>

        {/* Center Nav Links - Always visible without login */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50 text-xs font-semibold">
          {navLinks.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  active
                    ? "bg-background text-foreground shadow-sm font-bold text-red-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link href="/assess">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-red-500/20 gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Assess Cut
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
