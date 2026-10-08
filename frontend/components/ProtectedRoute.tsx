"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Public access enabled: render children directly without requiring authentication
  return <>{children}</>
}
