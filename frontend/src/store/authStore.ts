import { create } from 'zustand'
export interface PeakTalkUser {
  id: string
  email: string | null
  user_metadata: {
    display_name?: string
    name?: string
  }
}

export interface PeakTalkSession {
  expires_at?: number
}

interface AuthState {
  user: PeakTalkUser | null
  session: PeakTalkSession | null
  isLoading: boolean
  setUser: (user: PeakTalkUser | null) => void
  setSession: (session: PeakTalkSession | null) => void
  setIsLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
