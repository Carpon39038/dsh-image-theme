import type { Rgb } from './types.ts'

const HEX = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i

export function clamp(value: number, minimum = 0, maximum = 255): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function rgbToHex(color: Rgb): string {
  const channel = (value: number): string => Math.round(clamp(value)).toString(16).padStart(2, '0')
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`
}

export function hexToRgb(value: string): Rgb {
  const match = HEX.exec(value)
  if (match === null) throw new Error(`Invalid RGB hex color: ${value}`)
  return {
    r: Number.parseInt(match[1] ?? '00', 16),
    g: Number.parseInt(match[2] ?? '00', 16),
    b: Number.parseInt(match[3] ?? '00', 16),
  }
}

export function mixRgb(first: Rgb, second: Rgb, weight: number): Rgb {
  const amount = clamp(weight, 0, 1)
  return {
    r: first.r + (second.r - first.r) * amount,
    g: first.g + (second.g - first.g) * amount,
    b: first.b + (second.b - first.b) * amount,
  }
}

function linearChannel(value: number): number {
  const channel = clamp(value) / 255
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(color: Rgb): number {
  return 0.2126 * linearChannel(color.r) + 0.7152 * linearChannel(color.g) + 0.0722 * linearChannel(color.b)
}

export function contrastRatio(first: Rgb, second: Rgb): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

export function ensureContrast(foreground: Rgb, background: Rgb, target = 4.5): Rgb {
  if (contrastRatio(foreground, background) >= target) return foreground
  const white: Rgb = { r: 255, g: 255, b: 255 }
  const black: Rgb = { r: 0, g: 0, b: 0 }
  const destination = contrastRatio(white, background) >= contrastRatio(black, background) ? white : black
  for (let step = 1; step <= 20; step += 1) {
    const candidate = mixRgb(foreground, destination, step / 20)
    if (contrastRatio(candidate, background) >= target) return candidate
  }
  return destination
}

export function rgba(color: Rgb, alpha: number): string {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${clamp(alpha, 0, 1).toFixed(3)})`
}
