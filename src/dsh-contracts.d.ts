/**
 * Minimal compile-time faces for standalone development.
 *
 * DSH supplies the real services and runtime modules when the plugin is
 * loaded. Keeping these structural declarations local avoids installing the
 * current RC's unpublished workspace-only transitive packages.
 */
declare module '@deepseek-ai/dsh-client-ui-theme/client' {
  export interface ThemeTokenModes {
    light: string
    dark: string
  }

  export type ThemeTokenOverrides = Record<string, ThemeTokenModes>

  export interface ThemeRuntime {
    overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void
  }
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  import type { ComponentType } from 'react'

  export interface LocaleNamespaceMap {}

  export type PropsRuntime<K extends string> = K extends 'settings.section'
    ? { close: () => void }
    : object

  export type PropsLocale<N extends keyof LocaleNamespaceMap> = {
    t: (key: LocaleNamespaceMap[N]) => string
  }

  export type InjectFace<I extends object> = I

  export interface SlotRuntime {
    inject(name: string, factory: () => unknown): void
    register<P>(
      options: {
        name: string
        id?: string
        order?: number
        label?: () => string
        locale?: string
        inject?: () => object
      },
      component: ComponentType<P>,
    ): () => void
  }
}

declare module '@deepseek-ai/dsh-client-runtime/client' {
  import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
  import type { SlotRuntime } from '@deepseek-ai/dsh-client-ui-slots'

  export interface ClientContext {
    theme: ThemeRuntime
    slots: SlotRuntime
    locale: {
      register(namespace: string, dictionaries: Record<string, Record<string, string>>): () => void
      bind<N extends keyof import('@deepseek-ai/dsh-client-ui-slots').LocaleNamespaceMap>(
        namespace: N,
      ): (key: import('@deepseek-ai/dsh-client-ui-slots').LocaleNamespaceMap[N]) => string
    }
    effect(setup: () => void | (() => void), label?: string): void
  }
}

declare module '@deepseek-ai/dsh-client-locale/client' {}
declare module '@deepseek-ai/dsh-client-ui-settings/client' {}
