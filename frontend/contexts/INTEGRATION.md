# AuthContext Integration Guide

This guide shows how to integrate the AuthContext into your Next.js application.

## Step 1: Wrap Your Application

Update your root layout to include the AuthProvider:

### File: `app/layout.tsx`

```tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Beef Quality Assessment",
  description: "AI-powered beef quality evaluation system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

## Step 2: Create Authentication Pages

### Login Page Example

Create `app/login/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuthContext()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Sign Up Page Example

Create `app/signup/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuthContext()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await signUp(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to sign up")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Step 3: Create Protected Route Component

Create a component to protect authenticated routes:

### File: `components/ProtectedRoute.tsx`

```tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

## Step 4: Use Protected Routes

Wrap protected pages with the ProtectedRoute component:

### File: `app/dashboard/page.tsx`

```tsx
"use client"

import { useAuthContext } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"

function DashboardContent() {
  const { user, signOut } = useAuthContext()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
      <div>
        {/* Dashboard content */}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

## Step 5: Use Access Token for API Calls

Example of making authenticated API requests:

### File: `lib/api.ts` (Update)

```tsx
import { PredictionResponse } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function submitPrediction(
  file: File,
  accessToken: string
): Promise<PredictionResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Prediction failed")
  }

  return response.json()
}

export async function checkHealth(): Promise<{
  status: string
  models_loaded: boolean
}> {
  const response = await fetch(`${API_URL}/health`)
  if (!response.ok) {
    throw new Error("Health check failed")
  }
  return response.json()
}
```

### Usage in Component

```tsx
"use client"

import { useState } from "react"
import { useAuthContext } from "@/contexts/AuthContext"
import { submitPrediction } from "@/lib/api"
import { PredictionResponse } from "@/types"

export function AssessmentForm() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const { getAccessToken } = useAuthContext()

  const handleSubmit = async () => {
    if (!file) return

    const token = getAccessToken()
    if (!token) {
      alert("Please sign in to continue")
      return
    }

    setLoading(true)
    try {
      const response = await submitPrediction(file, token)
      setResult(response)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleSubmit} disabled={loading || !file}>
        {loading ? "Processing..." : "Assess Quality"}
      </button>
      {result && (
        <div>
          <h3>Results:</h3>
          <p>MQS: {result.meat_quality_score}</p>
          <p>Freshness: {result.freshness} ({result.freshness_confidence}%)</p>
          <p>Marbling: {result.marbling} ({result.marbling_confidence}%)</p>
        </div>
      )}
    </div>
  )
}
```

## Testing the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/signup to create an account

3. Sign in at http://localhost:3000/login

4. Access protected routes like http://localhost:3000/dashboard

5. Try signing out and verify you're redirected to login

## Troubleshooting

### "useAuthContext must be used within an AuthProvider"

Make sure AuthProvider wraps your entire app in `app/layout.tsx`.

### Session not persisting

Check that your Supabase configuration is correct in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Token expired errors

The Supabase client automatically refreshes tokens. If you're getting token errors, check:
1. Your Supabase project settings
2. Token expiration time configuration
3. Network connectivity

### Redirect loops

Ensure you don't wrap login/signup pages with ProtectedRoute component.

## Next Steps

1. Add password reset functionality
2. Implement email verification
3. Add OAuth providers (Google, GitHub, etc.)
4. Enhance error handling with toast notifications
5. Add loading states and skeletons
6. Implement remember me functionality
