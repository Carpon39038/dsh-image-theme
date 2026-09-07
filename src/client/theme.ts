import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import { ensureContrast, hexToRgb, mixRgb, rgba, rgbToHex } from './color.ts'
import { darkestPaletteColor } from './palette.ts'
import type { ImagePalette, Rgb, ThemeConfig } from './types.ts'

const black = { r: 0, g: 0, b: 0 }
const white = { r: 250, g: 248, b: 244 }

function modes(light: string, dark: string): { light: string; dark: string } {
  return { light, dark }
}

export interface ThemeRoles {
  surface: string
  accent: string
  foreground: string
  secondary: string
}

export interface ThemeRoleModes {
  light: ThemeRoles
  dark: ThemeRoles
}

function rolesForSurface(surface: Rgb, accent: Rgb, foreground: Rgb): ThemeRoles {
  const readableAccent = ensureContrast(accent, surface, 4.5)
  const readableForeground = ensureContrast(foreground, surface, 7)
  const secondary = ensureContrast(mixRgb(readableForeground, surface, 0.24), surface, 4.5)
  return {
    surface: rgbToHex(surface),
    accent: rgbToHex(readableAccent),
    foreground: rgbToHex(readableForeground),
    secondary: rgbToHex(secondary),
  }
}

export function createThemeRoleModes(palette: ImagePalette, accentIndex: number): ThemeRoleModes {
  const sourceSurface = hexToRgb(darkestPaletteColor(palette))
  const pickedAccent = hexToRgb(palette.colors[accentIndex] ?? palette.colors[0] ?? '#d79a54')
  return {
    light: rolesForSurface(mixRgb(sourceSurface, white, 0.9), pickedAccent, black),
    dark: rolesForSurface(mixRgb(sourceSurface, black, 0.62), pickedAccent, white),
  }
}

/** Backwards-compatible dark role set for consumers that use the original helper. */
export function createThemeRoles(palette: ImagePalette, accentIndex: number): ThemeRoles {
  return createThemeRoleModes(palette, accentIndex).dark
}

export function buildThemeTokens(palette: ImagePalette, config: ThemeConfig): ThemeTokenOverrides {
  const roles = createThemeRoleModes(palette, config.accentIndex)
  const lightSurface = hexToRgb(roles.light.surface)
  const darkSurface = hexToRgb(roles.dark.surface)
  const lightForeground = hexToRgb(roles.light.foreground)
  const darkForeground = hexToRgb(roles.dark.foreground)
  const strength = config.overlay / 100
  return {
    '--dsw-alias-bg-base': modes(
      rgba(lightSurface, 0.58 + strength * 0.24),
      rgba(darkSurface, 0.58 + strength * 0.24),
    ),
    '--dsw-alias-bg-layer-1': modes(
      rgba(mixRgb(lightSurface, white, 0.04), 0.66 + strength * 0.22),
      rgba(mixRgb(darkSurface, white, 0.04), 0.66 + strength * 0.22),
    ),
    '--dsw-alias-bg-layer-2': modes(
      rgba(mixRgb(lightSurface, white, 0.08), 0.7 + strength * 0.2),
      rgba(mixRgb(darkSurface, white, 0.08), 0.7 + strength * 0.2),
    ),
    '--dsw-alias-bg-overlay': modes(
      rgba(lightSurface, 0.9 + strength * 0.08),
      rgba(darkSurface, 0.9 + strength * 0.08),
    ),
    '--dsw-alias-border-l1': modes(rgba(lightForeground, 0.12), rgba(darkForeground, 0.12)),
    '--dsw-alias-border-l2': modes(rgba(lightForeground, 0.22), rgba(darkForeground, 0.22)),
    '--dsw-alias-brand-primary': modes(roles.light.accent, roles.dark.accent),
    '--dsw-alias-label-primary': modes(roles.light.foreground, roles.dark.foreground),
    '--dsw-alias-label-secondary': modes(roles.light.secondary, roles.dark.secondary),
    '--dsw-specific-sidebar-fill': modes(
      rgba(lightSurface, 0.54 + strength * 0.24),
      rgba(darkSurface, 0.54 + strength * 0.24),
    ),
  }
}
