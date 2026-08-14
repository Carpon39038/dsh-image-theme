import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import { extractPaletteFromBlob } from './palette.ts'
import {
  clearBackgroundImage,
  clearThemeSettings,
  readBackgroundImage,
  readThemeSettings,
  writeBackgroundImage,
  writeThemeSettings,
} from './storage.ts'
import { PLUGIN_STYLES } from './styles.ts'
import { buildThemeTokens } from './theme.ts'
import { DEFAULT_CONFIG, type ImageThemeState, type ThemeConfig } from './types.ts'

const SOURCE = '@cabeta/dsh-image-theme'
const MAX_IMAGE_BYTES = 16 * 1024 * 1024

export class ImageThemeController {
  private state: ImageThemeState = {
    status: 'loading',
    imageUrl: null,
    fileName: null,
    palette: null,
    config: { ...DEFAULT_CONFIG },
    error: null,
  }

  private readonly listeners = new Set<() => void>()
  private readonly theme: ThemeRuntime
  private themeDispose: (() => void) | undefined
  private styleElement: HTMLStyleElement | undefined
  private backdrop: HTMLDivElement | undefined
  private operation = 0

  constructor(theme: ThemeRuntime) {
    this.theme = theme
  }

  readonly getSnapshot = (): ImageThemeState => this.state

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  start(): () => void {
    this.ensureDom()
    void this.hydrate()
    return () => { this.dispose() }
  }

  private publish(next: ImageThemeState): void {
    this.state = next
    for (const listener of this.listeners) listener()
  }

  private ensureDom(): void {
    if (this.styleElement === undefined) {
      const style = document.createElement('style')
      style.dataset.plugin = SOURCE
      style.textContent = PLUGIN_STYLES
      document.head.appendChild(style)
      this.styleElement = style
    }
    if (this.backdrop === undefined) {
      const backdrop = document.createElement('div')
      backdrop.dataset.dshImageThemeBackdrop = ''
      backdrop.setAttribute('aria-hidden', 'true')
      ;(document.body ?? document.documentElement).prepend(backdrop)
      this.backdrop = backdrop
    }
  }

  private async hydrate(): Promise<void> {
    const revision = ++this.operation
    try {
      const saved = readThemeSettings()
      if (saved === null) {
        if (revision === this.operation) this.publish({ ...this.state, status: 'empty' })
        return
      }
      const blob = await readBackgroundImage()
      if (revision !== this.operation) return
      if (blob === null) {
        clearThemeSettings()
        this.publish({ ...this.state, status: 'empty' })
        return
      }
      const imageUrl = URL.createObjectURL(blob)
      this.publish({
        status: 'ready',
        imageUrl,
        fileName: saved.fileName,
        palette: saved.palette,
        config: saved.config,
        error: null,
      })
      this.present()
    } catch (error) {
      if (revision !== this.operation) return
      this.publish({ ...this.state, status: 'error', error: messageOf(error) })
    }
  }

  readonly upload = async (file: File): Promise<void> => {
    if (!file.type.startsWith('image/')) {
      this.publish({ ...this.state, error: '请选择 PNG、JPEG、WebP 或 AVIF 图片。' })
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.publish({ ...this.state, error: '图片不能超过 16 MB。' })
      return
    }
    const revision = ++this.operation
    const previous = this.state
    this.publish({ ...previous, status: 'saving', error: null })
    try {
      const palette = await extractPaletteFromBlob(file, 5)
      await writeBackgroundImage(file)
      if (revision !== this.operation) return
      const config = { ...previous.config, enabled: true, accentIndex: 0 }
      writeThemeSettings({ version: 1, fileName: file.name, palette, config })
      if (previous.imageUrl !== null) URL.revokeObjectURL(previous.imageUrl)
      this.publish({
        status: 'ready',
        imageUrl: URL.createObjectURL(file),
        fileName: file.name,
        palette,
        config,
        error: null,
      })
      this.present()
    } catch (error) {
      if (revision !== this.operation) return
      this.publish({ ...previous, status: previous.imageUrl === null ? 'error' : 'ready', error: messageOf(error) })
    }
  }

  readonly updateConfig = (patch: Partial<ThemeConfig>): void => {
    const config = { ...this.state.config, ...patch }
    if (this.state.palette !== null && this.state.fileName !== null) {
      config.accentIndex = Math.max(0, Math.min(this.state.palette.colors.length - 1, config.accentIndex))
      writeThemeSettings({
        version: 1,
        fileName: this.state.fileName,
        palette: this.state.palette,
        config,
      })
    }
    this.publish({ ...this.state, config, error: null })
    this.present()
  }

  readonly reset = async (): Promise<void> => {
    const revision = ++this.operation
    this.publish({ ...this.state, status: 'saving', error: null })
    try {
      await clearBackgroundImage()
      if (revision !== this.operation) return
      clearThemeSettings()
      if (this.state.imageUrl !== null) URL.revokeObjectURL(this.state.imageUrl)
      this.publish({
        status: 'empty',
        imageUrl: null,
        fileName: null,
        palette: null,
        config: { ...DEFAULT_CONFIG },
        error: null,
      })
      this.present()
    } catch (error) {
      if (revision !== this.operation) return
      this.publish({ ...this.state, status: 'error', error: messageOf(error) })
    }
  }

  private present(): void {
    this.ensureDom()
    const active = this.state.config.enabled && this.state.imageUrl !== null && this.state.palette !== null
    if (!active) {
      this.themeDispose?.()
      this.themeDispose = undefined
      if (this.backdrop !== undefined) this.backdrop.style.opacity = '0'
      document.body?.removeAttribute('data-dsh-image-theme')
      return
    }
    const previousDispose = this.themeDispose
    this.themeDispose = this.theme.overrideTokens(SOURCE, buildThemeTokens(this.state.palette as NonNullable<ImageThemeState['palette']>, this.state.config))
    previousDispose?.()

    const backdrop = this.backdrop
    if (backdrop !== undefined) {
      const overlay = Math.min(0.78, (this.state.config.overlay / 100) * 0.72)
      backdrop.style.opacity = '1'
      backdrop.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, ${overlay}), rgba(0, 0, 0, ${Math.min(0.88, overlay + 0.12)})), url("${this.state.imageUrl}")`
      backdrop.style.backgroundPosition = `${this.state.config.positionX}% ${this.state.config.positionY}%`
      backdrop.style.filter = `blur(${this.state.config.blur}px) saturate(${this.state.config.saturation}%)`
      backdrop.style.setProperty('--dsh-image-theme-scale', String(1 + this.state.config.blur / 220))
    }
    document.body?.setAttribute('data-dsh-image-theme', 'on')
  }

  private dispose(): void {
    ++this.operation
    this.themeDispose?.()
    this.themeDispose = undefined
    if (this.state.imageUrl !== null) URL.revokeObjectURL(this.state.imageUrl)
    this.backdrop?.remove()
    this.backdrop = undefined
    this.styleElement?.remove()
    this.styleElement = undefined
    document.body?.removeAttribute('data-dsh-image-theme')
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : '无法处理这张图片。'
}
