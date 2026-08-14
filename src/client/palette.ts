import { hexToRgb, mixRgb, relativeLuminance, rgbToHex } from './color.ts'
import type { ImagePalette, Rgb } from './types.ts'

interface Lab {
  l: number
  a: number
  b: number
}

interface Sample {
  rgb: Rgb
  lab: Lab
}

interface Cluster {
  centroid: Lab
  count: number
  rgb: Rgb
}

const MAX_SAMPLES = 6_000

function pivotRgb(value: number): number {
  const channel = value / 255
  return channel > 0.04045 ? ((channel + 0.055) / 1.055) ** 2.4 : channel / 12.92
}

function pivotXyz(value: number): number {
  return value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116
}

export function rgbToLab(rgb: Rgb): Lab {
  const red = pivotRgb(rgb.r)
  const green = pivotRgb(rgb.g)
  const blue = pivotRgb(rgb.b)
  const x = pivotXyz((red * 0.4124 + green * 0.3576 + blue * 0.1805) / 0.95047)
  const y = pivotXyz(red * 0.2126 + green * 0.7152 + blue * 0.0722)
  const z = pivotXyz((red * 0.0193 + green * 0.1192 + blue * 0.9505) / 1.08883)
  return { l: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) }
}

function distance(first: Lab, second: Lab): number {
  return (first.l - second.l) ** 2 + (first.a - second.a) ** 2 + (first.b - second.b) ** 2
}

function nearest(lab: Lab, centroids: readonly Lab[]): number {
  let index = 0
  let closest = Number.POSITIVE_INFINITY
  for (let candidate = 0; candidate < centroids.length; candidate += 1) {
    const centroid = centroids[candidate]
    if (centroid === undefined) continue
    const current = distance(lab, centroid)
    if (current < closest) {
      closest = current
      index = candidate
    }
  }
  return index
}

function seedCentroids(samples: readonly Sample[], count: number): Lab[] {
  const average = samples.reduce<Lab>((sum, sample) => ({
    l: sum.l + sample.lab.l / samples.length,
    a: sum.a + sample.lab.a / samples.length,
    b: sum.b + sample.lab.b / samples.length,
  }), { l: 0, a: 0, b: 0 })
  const centroids: Lab[] = [{ ...samples.reduce((best, sample) => (
    distance(sample.lab, average) < distance(best.lab, average) ? sample : best
  )).lab }]
  while (centroids.length < count) {
    const next = samples.reduce((farthest, sample) => {
      const score = Math.min(...centroids.map(centroid => distance(sample.lab, centroid)))
      return score > farthest.score ? { sample, score } : farthest
    }, { sample: samples[0] as Sample, score: -1 })
    centroids.push({ ...next.sample.lab })
  }
  return centroids
}

function cluster(samples: readonly Sample[], count: number): Cluster[] {
  let centroids = seedCentroids(samples, count)
  const assignments = new Uint8Array(samples.length)
  for (let iteration = 0; iteration < 18; iteration += 1) {
    const totals = Array.from({ length: count }, () => ({ l: 0, a: 0, b: 0, count: 0 }))
    samples.forEach((sample, sampleIndex) => {
      const index = nearest(sample.lab, centroids)
      assignments[sampleIndex] = index
      const total = totals[index]
      if (total === undefined) return
      total.l += sample.lab.l
      total.a += sample.lab.a
      total.b += sample.lab.b
      total.count += 1
    })
    const next = totals.map((total, index) => total.count === 0
      ? centroids[index] as Lab
      : { l: total.l / total.count, a: total.a / total.count, b: total.b / total.count })
    const movement = next.reduce((sum, centroid, index) => sum + distance(centroid, centroids[index] as Lab), 0)
    centroids = next
    if (movement < 0.01) break
  }

  const totals = Array.from({ length: count }, () => ({ r: 0, g: 0, b: 0, count: 0 }))
  samples.forEach((sample, index) => {
    const total = totals[assignments[index] ?? 0]
    if (total === undefined) return
    total.r += sample.rgb.r
    total.g += sample.rgb.g
    total.b += sample.rgb.b
    total.count += 1
  })
  return totals.map((total, index) => ({
    centroid: centroids[index] as Lab,
    count: total.count,
    rgb: total.count === 0
      ? samples[index % samples.length]?.rgb ?? { r: 16, g: 16, b: 16 }
      : { r: total.r / total.count, g: total.g / total.count, b: total.b / total.count },
  })).sort((first, second) => second.count - first.count)
}

export function extractPaletteFromPixels(data: ArrayLike<number>, colorCount = 5): ImagePalette {
  const pixelCount = Math.floor(data.length / 4)
  if (pixelCount === 0) throw new Error('The image has no readable pixels.')
  const stride = Math.max(1, Math.ceil(pixelCount / MAX_SAMPLES))
  const samples: Sample[] = []
  for (let pixel = 0; pixel < pixelCount; pixel += stride) {
    const offset = pixel * 4
    if ((data[offset + 3] ?? 255) < 160) continue
    const rgb = { r: data[offset] ?? 0, g: data[offset + 1] ?? 0, b: data[offset + 2] ?? 0 }
    samples.push({ rgb, lab: rgbToLab(rgb) })
  }
  if (samples.length === 0) throw new Error('The image is fully transparent.')
  const count = Math.max(1, Math.min(colorCount, samples.length))
  const colors = cluster(samples, count).map(result => rgbToHex(result.rgb))
  while (colors.length < colorCount) {
    const source = hexToRgb(colors[colors.length % Math.max(colors.length, 1)] ?? '#202020')
    colors.push(rgbToHex(mixRgb(source, { r: 255, g: 255, b: 255 }, 0.18 + colors.length * 0.06)))
  }
  return { colors }
}

async function decodeImage(blob: Blob): Promise<{
  source: CanvasImageSource
  width: number
  height: number
  cleanup: () => void
}> {
  if ('createImageBitmap' in globalThis) {
    const bitmap = await createImageBitmap(blob)
    return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => { bitmap.close() } }
  }
  const url = URL.createObjectURL(blob)
  const image = new Image()
  image.decoding = 'async'
  image.src = url
  await image.decode()
  return { source: image, width: image.naturalWidth, height: image.naturalHeight, cleanup: () => { URL.revokeObjectURL(url) } }
}

export async function extractPaletteFromBlob(blob: Blob, colorCount = 5): Promise<ImagePalette> {
  const decoded = await decodeImage(blob)
  try {
    const scale = Math.min(1, 96 / Math.max(decoded.width, decoded.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(decoded.width * scale))
    canvas.height = Math.max(1, Math.round(decoded.height * scale))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (context === null) throw new Error('Canvas color extraction is not available.')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height)
    return extractPaletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data, colorCount)
  } finally {
    decoded.cleanup()
  }
}

export function darkestPaletteColor(palette: ImagePalette): string {
  return palette.colors.reduce((darkest, color) => (
    relativeLuminance(hexToRgb(color)) < relativeLuminance(hexToRgb(darkest)) ? color : darkest
  ), palette.colors[0] ?? '#151515')
}
