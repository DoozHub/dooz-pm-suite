import { create } from 'zustand'
import type { Intent, Proposal } from '../api/client'

interface AppState {
  darkMode: boolean
  sidebarOpen: boolean
  selectedIntent: Intent | null
  pendingProposals: Proposal[]
  setDarkMode: (dark: boolean) => void
  toggleDarkMode: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSelectedIntent: (intent: Intent | null) => void
  setPendingProposals: (proposals: Proposal[]) => void
}

export const useAppStore = create<AppState>((set) => ({
  darkMode: true,
  sidebarOpen: true,
  selectedIntent: null,
  pendingProposals: [],
  setDarkMode: (dark) => set({ darkMode: dark }),
  toggleDarkMode: () => set((state) => {
    const newDark = !state.darkMode
    if (newDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return { darkMode: newDark }
  }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSelectedIntent: (intent) => set({ selectedIntent: intent }),
  setPendingProposals: (proposals) => set({ pendingProposals: proposals }),
}))
