import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import { ensureContrast, hexToRgb, mixRgb, rgba, rgbToHex } from './color.ts'
import { darkestPaletteColor } from './palette.ts'
import type { ImagePalette, ThemeConfig } from './types.ts'

const black = { r: 0, g: 0, b: 0 }
const white = { r: 250, g: 248, b: 244 }

function pair(value: string): { light: string; dark: string } {
  return { light: value, dark: value }
}

export interface ThemeRoles {
  surface: string
  accent: string
  foreground: string
  secondary: string
}

export function createThemeRoles(palette: ImagePalette, accentIndex: number): ThemeRoles {
  const sourceSurface = hexToRgb(darkestPaletteColor(palette))
  const surface = mixRgb(sourceSurface, black, 0.62)
  const pickedAccent = hexToRgb(palette.colors[accentIndex] ?? palette.colors[0] ?? '#d79a54')
  const accent = ensureContrast(pickedAccent, surface, 3.2)
  const foreground = ensureContrast(white, surface, 7)
  return {
    surface: rgbToHex(surface),
    accent: rgbToHex(accent),
    foreground: rgbToHex(foreground),
    secondary: rgbToHex(mixRgb(foreground, surface, 0.34)),
  }
}

export function buildThemeTokens(palette: ImagePalette, config: ThemeConfig): ThemeTokenOverrides {
  const roles = createThemeRoles(palette, config.accentIndex)
  const surface = hexToRgb(roles.surface)
  const foreground = hexToRgb(roles.foreground)
  const strength = config.overlay / 100
  return {
    '--dsw-alias-bg-base': pair(rgba(surface, 0.58 + strength * 0.24)),
    '--dsw-alias-bg-layer-1': pair(rgba(mixRgb(surface, white, 0.04), 0.66 + strength * 0.22)),
    '--dsw-alias-bg-layer-2': pair(rgba(mixRgb(surface, white, 0.08), 0.7 + strength * 0.2)),
    '--dsw-alias-bg-overlay': pair(rgba(surface, 0.9 + strength * 0.08)),
    '--dsw-alias-border-l1': pair(rgba(foreground, 0.12)),
    '--dsw-alias-border-l2': pair(rgba(foreground, 0.22)),
    '--dsw-alias-brand-primary': pair(roles.accent),
    '--dsw-alias-label-primary': pair(roles.foreground),
    '--dsw-alias-label-secondary': pair(roles.secondary),
    '--dsw-specific-sidebar-fill': pair(rgba(surface, 0.54 + strength * 0.24)),
  }
}
