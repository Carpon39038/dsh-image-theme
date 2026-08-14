import { describe, expect, it } from 'vitest'
import { contrastRatio, ensureContrast, hexToRgb } from '../src/client/color.ts'
import { extractPaletteFromPixels } from '../src/client/palette.ts'
import { buildThemeTokens, createThemeRoles } from '../src/client/theme.ts'
import { DEFAULT_CONFIG } from '../src/client/types.ts'

function pixels(colors: readonly string[], repeats: number): Uint8ClampedArray {
  const data: number[] = []
  for (const color of colors) {
    const rgb = hexToRgb(color)
    for (let index = 0; index < repeats; index += 1) data.push(rgb.r, rgb.g, rgb.b, 255)
  }
  return new Uint8ClampedArray(data)
}

describe('image palette', () => {
  it('extracts five deterministic Lab clusters', () => {
    const source = pixels(['#090806', '#3d2817', '#8c562c', '#e0a057', '#fff0c5'], 30)
    const first = extractPaletteFromPixels(source)
    const second = extractPaletteFromPixels(source)
    expect(first.colors).toHaveLength(5)
    expect(second).toEqual(first)
  })

  it('ignores transparent pixels', () => {
    const source = new Uint8ClampedArray([
      255, 0, 255, 0,
      20, 30, 40, 255,
      20, 30, 40, 255,
    ])
    expect(extractPaletteFromPixels(source, 1).colors).toEqual(['#141e28'])
  })
})

describe('theme safety', () => {
  const palette = { colors: ['#3d2817', '#e0a057', '#090806', '#fff0c5', '#8c562c'] }

  it('keeps the selected accent readable on the derived surface', () => {
    const roles = createThemeRoles(palette, 0)
    expect(contrastRatio(hexToRgb(roles.accent), hexToRgb(roles.surface))).toBeGreaterThanOrEqual(3.2)
  })

  it('publishes mandatory light and dark values for each DSH token', () => {
    const tokens = buildThemeTokens(palette, { ...DEFAULT_CONFIG })
    expect(Object.keys(tokens)).toContain('--dsw-alias-brand-primary')
    for (const modes of Object.values(tokens)) {
      expect(modes.light).toBeTruthy()
      expect(modes.dark).toBeTruthy()
    }
  })

  it('can repair low-contrast colors to WCAG AA', () => {
    const background = hexToRgb('#202020')
    const repaired = ensureContrast(hexToRgb('#303030'), background, 4.5)
    expect(contrastRatio(repaired, background)).toBeGreaterThanOrEqual(4.5)
  })
})
