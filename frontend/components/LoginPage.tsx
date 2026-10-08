"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, Beef, CheckCircle2 } from "lucide-react"

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { signIn, signUp } = useAuthContext()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!email || !password) {
      setError("Please fill in all required fields.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    try {
      setSubmitting(true)
      if (isSignUp) {
        await signUp(email, password)
        setSuccessMsg("Account created! Check your email or sign in directly.")
        setIsSignUp(false)
      } else {
        await signIn(email, password)
        router.push("/assess")
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please check your credentials.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Glow Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-lg shadow-red-500/20 text-white mb-3">
            <Beef className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            MeatScan AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Automated Beef Quality Evaluation & MQS Scoring Platform
          </p>
        </div>

        <Card className="border border-border/80 shadow-2xl backdrop-blur-xl bg-card/90">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex bg-muted/60 p-1 rounded-lg mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false)
                  setError(null)
                }}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  !isSignUp
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true)
                  setError(null)
                }}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  isSignUp
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>
            <CardTitle className="text-xl font-bold">
              {isSignUp ? "Register new account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "Enter your email and create a password to access quality analytics"
                : "Enter your credentials to access beef evaluation tools"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="evaluator@quality-beef.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-10"
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 h-10"
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-10 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium shadow-md transition-all"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isSignUp ? "Create Account" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
