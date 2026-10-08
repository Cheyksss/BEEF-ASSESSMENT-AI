/**
 * Unit Tests for AuthContext
 * 
 * Tests validate:
 * - Provider initialization
 * - User and session state management
 * - Authentication methods (signUp, signIn, signOut)
 * - Access token retrieval
 * - Session persistence and refresh handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuthContext } from './AuthContext'
import { supabase } from '@/lib/supabase'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

describe('AuthContext', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00.000Z',
    aud: 'authenticated',
    role: 'authenticated',
  }

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000,
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation
    ;(supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    ;(supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })
  })

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      expect(result.current.loading).toBe(true)
    })

    it('should initialize with null user and session', async () => {
      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })

    it('should load existing session on mount', async () => {
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
    })
  })

  describe('signUp method', () => {
    it('should successfully sign up a new user', async () => {
      ;(supabase.auth.signUp as any).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signUpResult
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123')
      })

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(signUpResult).toEqual({ user: mockUser, session: mockSession })
    })

    it('should throw error on sign up failure', async () => {
      const mockError = new Error('Sign up failed')
      ;(supabase.auth.signUp as any).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(async () => {
        await act(async () => {
          await result.current.signUp('test@example.com', 'password123')
        })
      }).rejects.toThrow('Sign up failed')
    })
  })

  describe('signIn method', () => {
    it('should successfully sign in a user', async () => {
      ;(supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signInResult
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123')
      })

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(signInResult).toEqual({ user: mockUser, session: mockSession })
    })

    it('should throw error on sign in failure', async () => {
      const mockError = new Error('Invalid credentials')
      ;(supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(async () => {
        await act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword')
        })
      }).rejects.toThrow('Invalid credentials')
    })
  })

  describe('signOut method', () => {
    it('should successfully sign out', async () => {
      ;(supabase.auth.signOut as any).mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should throw error on sign out failure', async () => {
      const mockError = new Error('Sign out failed')
      ;(supabase.auth.signOut as any).mockResolvedValue({
        error: mockError,
      })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(async () => {
        await act(async () => {
          await result.current.signOut()
        })
      }).rejects.toThrow('Sign out failed')
    })
  })

  describe('getAccessToken method', () => {
    it('should return null when no session exists', async () => {
      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.getAccessToken()).toBeNull()
    })

    it('should return access token when session exists', async () => {
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.getAccessToken()).toBe('mock-access-token')
    })
  })

  describe('Session persistence and refresh', () => {
    it('should update state when auth state changes', async () => {
      let authStateCallback: any

      ;(supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }
      })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate auth state change
      act(() => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.session).toEqual(mockSession)
      })
    })

    it('should cleanup subscription on unmount', async () => {
      const unsubscribeMock = vi.fn()
      
      ;(supabase.auth.onAuthStateChange as any).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: unsubscribeMock,
          },
        },
      })

      const { unmount } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should throw error when useAuthContext is used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => useAuthContext())
      }).toThrow('useAuthContext must be used within an AuthProvider')

      console.error = consoleError
    })
  })
})
