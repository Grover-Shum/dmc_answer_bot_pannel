export type Theme = 'dark' | 'light'

const storageKey = 'agent_dashboard_theme'

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = window.localStorage.getItem(storageKey)
  if (saved === 'dark' || saved === 'light') return saved
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  return prefersDark ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function persistTheme(theme: Theme) {
  window.localStorage.setItem(storageKey, theme)
}

