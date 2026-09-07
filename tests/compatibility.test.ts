// @vitest-environment happy-dom
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as cordis from '@deepseek-ai/cordis'
import * as slots from '@deepseek-ai/dsh-client-ui-slots'
import * as store from '@deepseek-ai/dsh-client-store'
import * as primitives from '@deepseek-ai/dsh-client-ui-primitives'
import type { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { writeBackgroundImage, writeThemeSettings } from '../src/client/storage.ts'
import { DEFAULT_CONFIG } from '../src/client/types.ts'
import type { ImageThemeController } from '../src/client/controller.ts'
import type * as ImageThemePlugin from '../src/client/index.ts'

const require = createRequire(import.meta.url)
const manifest = require('../package.json')
const shared: Record<string, unknown> = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  'react-dom': ReactDOM,
  'react-dom/client': ReactDOMClient,
  '@deepseek-ai/cordis': cordis,
  '@deepseek-ai/dsh-client-ui-slots': slots,
  '@deepseek-ai/dsh-client-store': store,
  '@deepseek-ai/dsh-client-ui-primitives': primitives,
}

/** Execute the same published module-loader wrappers the DSH browser loads. */
function loadClient<T>(path: string): T {
  let exports: T | undefined
  runInNewContext(readFileSync(path, 'utf8'), {
    window: {
      __ModuleLoader__: {
        load: ({ factory }: { factory: (require: (id: string) => unknown) => T }) => {
          exports = factory((id) => {
            if (!(id in shared)) throw new Error(`Unprovided client module: ${id}`)
            return shared[id]
          })
        },
      },
    },
    document,
    navigator,
    localStorage,
    indexedDB,
    URL,
    console,
    matchMedia: window.matchMedia.bind(window),
  }, { filename: path })
  if (exports === undefined) throw new Error(`No DSH client registration: ${path}`)
  return exports
}

afterEach(() => {
  localStorage.clear()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DSH 0.1.2-rc.1 published client compatibility', () => {
  it('resolves every injected package to an available web client', () => {
    for (const id of manifest.dsh.client.inject as string[]) {
      const dependency = require(`${id}/package.json`)
      expect(dependency.version).toBe('0.1.2-rc.1')
      expect(dependency.dsh.client.platform).toBe('web')
      expect(require.resolve(`${id}/client`)).toBeTruthy()
    }
  })

  it.each(['light', 'dark', 'system'])('restores, updates and disposes the theme in %s mode', async (preference) => {
    vi.stubGlobal('indexedDB', new IDBFactory())
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:dsh-image-theme-test')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    await writeBackgroundImage(new Blob(['saved image'], { type: 'image/png' }))
    writeThemeSettings({
      version: 1,
      fileName: 'saved-wallpaper.png',
      palette: { colors: ['#112233', '#ddaa55', '#223344', '#8899aa', '#fafafa'] },
      config: { ...DEFAULT_CONFIG },
    })

    const renderer = loadClient<{ SlotRegistry: typeof SlotRegistry }>(require.resolve('@deepseek-ai/dsh-client-ui-renderer/client'))
    const themes = loadClient<{ ThemeRuntime: typeof ThemeRuntime }>(require.resolve('@deepseek-ai/dsh-client-ui-theme/client'))
    const locales = loadClient<{ LocaleRuntime: typeof LocaleRuntime }>(require.resolve('@deepseek-ai/dsh-client-locale/client'))
    const plugin = loadClient<typeof ImageThemePlugin>(require.resolve('../lib/client.js'))
    const ctx = new cordis.Context()
    const registry = new renderer.SlotRegistry(ctx)
    const locale = new locales.LocaleRuntime(ctx)
    const theme = new themes.ThemeRuntime(ctx, {
      getSnapshot: () => ({ value: { preference, fontSize: 14 } }),
      subscribe: () => () => {},
      set: () => {},
    } as ConstructorParameters<typeof ThemeRuntime>[1])
    ctx.provide('locale', locale)
    ctx.provide('theme', theme)
    registry.installLocale(locale)
    const base = { ...theme.getTheme().active.tokens }
    const fiber = await ctx.plugin(plugin)
    let unmountShell: (() => void) | undefined
    let root: ReturnType<typeof ReactDOMClient.createRoot> | undefined
    try {
      // The plugin can arrive before settings declares its extension slot.
      expect(registry.entries('settings.section')).toHaveLength(0)
      const mountShell = () => registry.register({
        name: 'root',
        children: { 'settings.section': { kind: 'list', scope: 'root' } },
      }, () => null)
      unmountShell = mountShell()
      const entry = registry.entries('settings.section')[0]
      expect(entry?.options.id).toBe('image-theme')
      const { controller } = entry?.inject?.() as { controller: ImageThemeController }
      await vi.waitFor(() => { expect(controller.getSnapshot().status).toBe('ready') })
      expect(controller.getSnapshot().fileName).toBe('saved-wallpaper.png')
      expect(document.body.dataset.dshImageTheme).toBe('on')
      expect(document.querySelectorAll('[data-dsh-image-theme-backdrop]')).toHaveLength(1)

      locale.setLocale('zh')
      expect(slots.resolveSlotLabel(entry?.options.label)).toBe('图片主题')
      locale.setLocale('en')
      expect(slots.resolveSlotLabel(entry?.options.label)).toBe('Image theme')
      const container = document.createElement('div')
      document.body.appendChild(container)
      root = ReactDOMClient.createRoot(container)
      ReactDOM.flushSync(() => root!.render(React.createElement(entry!.component as React.ComponentType<{
        controller: ImageThemeController
        t: (key: string) => string
        close: () => void
      }>, { controller, t: locale.bind('settings.imageTheme'), close: () => {} })))
      expect(container.textContent).toContain('saved-wallpaper.png')
      expect(container.querySelectorAll('input[type="range"]')).toHaveLength(5)

      const previousAccent = theme.getTheme().active.tokens['--dsw-alias-brand-primary']
      controller.updateConfig({ accentIndex: 1, blur: 9 })
      expect(theme.getTheme().active.tokens['--dsw-alias-brand-primary']).not.toBe(previousAccent)
      expect(document.querySelector<HTMLElement>('[data-dsh-image-theme-backdrop]')?.style.filter).toContain('blur(9px)')
      theme.setTheme('dark')
      const darkLabel = theme.getTheme().active.tokens['--dsw-alias-label-primary']
      theme.setTheme('light')
      expect(theme.getTheme().active.tokens['--dsw-alias-label-primary']).not.toBe(darkLabel)

      controller.updateConfig({ enabled: false })
      expect(theme.getTheme().active.tokens).toEqual(base)
      expect(document.body.hasAttribute('data-dsh-image-theme')).toBe(false)
      controller.updateConfig({ enabled: true })
      expect(document.body.dataset.dshImageTheme).toBe('on')

      unmountShell()
      expect(registry.entries('settings.section')).toHaveLength(0)
      unmountShell = mountShell()
      expect(registry.entries('settings.section')).toHaveLength(1)
      await fiber.dispose()
      expect(registry.entries('settings.section')).toHaveLength(0)
      expect(theme.getTheme().active.tokens).toEqual(base)
      expect(document.querySelector('[data-dsh-image-theme-backdrop]')).toBeNull()
      expect(document.querySelector('style[data-plugin="@cabeta/dsh-image-theme"]')).toBeNull()
      expect(revoke).toHaveBeenCalledWith('blob:dsh-image-theme-test')
      expect(localStorage.getItem('dsh-image-theme/settings-v1')).toContain('saved-wallpaper.png')
    } finally {
      root?.unmount()
      await fiber.dispose()
      unmountShell?.()
    }
  })
})
