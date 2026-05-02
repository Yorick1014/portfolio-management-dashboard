import type { CSSProperties } from 'react'

export type AppTheme = 'dark' | 'light'

export const themeStorageKey = 'portfolio_theme'

export function getStoredTheme(): AppTheme {
  const storedTheme = localStorage.getItem(themeStorageKey)
  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark'
}

export function getThemeStyle(theme: AppTheme) {
  const isLightTheme = theme === 'light'

  return {
    '--app-bg': isLightTheme ? '#F2F4F7' : '#0F1117',
    '--panel-bg': isLightTheme ? '#FFFFFF' : '#151922',
    '--panel-alt': isLightTheme ? '#F7F9FC' : '#11141B',
    '--rail-bg': isLightTheme ? '#E8EDF5' : '#202735',
    '--toolbar-bg': isLightTheme ? '#FFFFFF' : '#11141B',
    '--border': isLightTheme ? '#D9DFEA' : '#2A303A',
    '--border-soft': isLightTheme ? '#E5EAF2' : '#252B35',
    '--text-primary': isLightTheme ? '#111827' : '#FFFFFF',
    '--text-secondary': isLightTheme ? '#334155' : '#DDE3EA',
    '--text-muted': isLightTheme ? '#64748B' : '#8E98A8',
    '--text-subtle': isLightTheme ? '#94A3B8' : '#687284',
    '--hover-bg': isLightTheme ? '#DDE5F0' : '#252D3A',
  } as CSSProperties
}
