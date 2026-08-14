import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import { ImageThemeController } from './controller.ts'
import { ImageThemeSection, type ImageThemeSectionInjected } from './ImageThemeSection.tsx'
import { en, zh, type ImageThemeKey } from './locales.ts'

const NS = 'settings.imageTheme' as const

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.imageTheme': ImageThemeKey
  }
}

export const inject = ['slots', 'locale', 'theme']

export function apply(ctx: ClientContext): void {
  const controller = new ImageThemeController(ctx.theme)
  const injected = (): ImageThemeSectionInjected => ({ controller })

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'image-theme: locale dictionaries')
  ctx.effect(() => controller.start(), 'image-theme: background and token presenter')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'image-theme',
    order: 35,
    label: () => ctx.locale.bind(NS)('nav'),
    locale: NS,
    inject: injected,
  }, ImageThemeSection))
}

export { extractPaletteFromBlob, extractPaletteFromPixels } from './palette.ts'
export { buildThemeTokens, createThemeRoles } from './theme.ts'
export type { ImagePalette, ImageThemeState, ThemeConfig } from './types.ts'
