# Authentication Context

This directory contains the authentication context provider for the Beef Quality Assessment application.

## AuthContext

The `AuthContext` provides authentication state and methods throughout the application.

### Features

- **User and Session Management**: Maintains current user and session state
- **Authentication Methods**: Provides `signUp`, `signIn`, and `signOut` methods
- **Access Token Retrieval**: `getAccessToken()` method for API requests
- **Session Persistence**: Automatically loads and refreshes sessions
- **Type-Safe**: Full TypeScript support with proper types

### Usage

#### 1. Wrap your app with AuthProvider

In your root layout (`app/layout.tsx`):

```tsx
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

#### 2. Use the authentication context in components

```tsx
import { useAuthContext } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, session, loading, signIn, signOut, getAccessToken } = useAuthContext()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <p>Welcome {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### API Reference

#### State

- `user: User | null` - Current authenticated user or null
- `session: Session | null` - Current session with tokens or null
- `loading: boolean` - True while checking authentication state

#### Methods

##### `signUp(email: string, password: string)`

Registers a new user account.

```tsx
try {
  const { user, session } = await signUp('user@example.com', 'password123')
  console.log('Signed up:', user)
} catch (error) {
  console.error('Sign up failed:', error)
}
```

##### `signIn(email: string, password: string)`

Authenticates an existing user.

```tsx
try {
  const { user, session } = await signIn('user@example.com', 'password123')
  console.log('Signed in:', user)
} catch (error) {
  console.error('Sign in failed:', error)
}
```

##### `signOut()`

Ends the current session.

```tsx
try {
  await signOut()
  console.log('Signed out')
} catch (error) {
  console.error('Sign out failed:', error)
}
```

##### `getAccessToken()`

Returns the current access token for API requests.

```tsx
const token = getAccessToken()
if (token) {
  // Use token for API calls
  fetch('/api/endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}
```

### Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 1.1**: Frontend integrates Supabase authentication for user registration
- **Requirement 1.2**: Frontend integrates Supabase authentication for user login
- **Requirement 1.3**: Frontend integrates Supabase authentication for user logout
- **Requirement 1.4**: System creates a user session when user successfully authenticates

### Testing

Run tests with:

```bash
npm test
```

The test suite (`AuthContext.test.tsx`) validates:
- Provider initialization with loading state
- Session loading from storage
- User registration (signUp)
- User authentication (signIn)
- Session termination (signOut)
- Access token retrieval
- Session persistence and refresh
- Error handling
- Context usage validation

### Session Management

The AuthContext automatically:
1. Loads existing sessions on mount from Supabase storage
2. Listens for authentication state changes
3. Refreshes tokens before expiration
4. Updates state when sessions change
5. Cleans up subscriptions on unmount

### Error Handling

All authentication methods throw errors when operations fail. Always wrap calls in try-catch blocks:

```tsx
const handleSignIn = async () => {
  try {
    await signIn(email, password)
    // Success - user is now signed in
  } catch (error) {
    // Handle error - show message to user
    console.error('Sign in failed:', error)
  }
}
```

### Type Definitions

The context uses the following types from Supabase:

```typescript
interface User {
  id: string
  email: string
  // ... other Supabase user fields
}

interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: User
  // ... other Supabase session fields
}
```

### Implementation Notes

1. **Client-side Only**: This is a client component (`"use client"`) suitable for Next.js App Router
2. **Supabase Integration**: Uses the Supabase client from `@/lib/supabase`
3. **Automatic Refresh**: Supabase handles token refresh automatically
4. **Storage**: Sessions are persisted in browser storage by Supabase
5. **Type Safety**: Full TypeScript support with proper error handling
