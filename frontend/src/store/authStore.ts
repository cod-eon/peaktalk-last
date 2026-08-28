import { create } from 'zustand'
export interface PeakTalkUser {
  id: string
  email: string | null
  email_verified: boolean
  user_metadata: {
    display_name?: string
    name?: string
  }
}

export interface PeakTalkSession {
  expires_at?: number
}

export type AuthStatus = 'loading' | 'signed_out' | 'email_verification_required' | 'ready'

interface AuthState {
  user: PeakTalkUser | null
  session: PeakTalkSession | null
  authState: AuthStatus
  isLoading: boolean
  setUser: (user: PeakTalkUser | null) => void
  setSession: (session: PeakTalkSession | null) => void
  setAuthState: (authState: AuthStatus) => void
  setIsLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  authState: 'loading',
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setAuthState: (authState) => set({ authState }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
