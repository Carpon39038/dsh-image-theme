import { useState, useSyncExternalStore } from 'react'
import type { CSSProperties, ChangeEvent, DragEvent, ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ImageThemeController } from './controller.ts'
import type { ImageThemeKey } from './locales.ts'
import type { ThemeConfig } from './types.ts'

export interface ImageThemeSectionInjected {
  controller: ImageThemeController
}

export type ImageThemeSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings.imageTheme'>
  & InjectFace<ImageThemeSectionInjected>

interface RangeControlProps {
  label: string
  value: number
  minimum: number
  maximum: number
  suffix: string
  onChange: (value: number) => void
}

function RangeControl({ label, value, minimum, maximum, suffix, onChange }: RangeControlProps): ReactNode {
  return (
    <div className="dsh-image-theme-section__range">
      <label>
        <span>{label}</span>
        <output>{value}{suffix}</output>
      </label>
      <input
        type="range"
        min={minimum}
        max={maximum}
        value={value}
        aria-label={label}
        onChange={(event) => { onChange(Number(event.currentTarget.value)) }}
      />
    </div>
  )
}

export function ImageThemeSection({ controller, t }: ImageThemeSectionProps): ReactNode {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot)
  const [dragging, setDragging] = useState(false)
  const busy = state.status === 'saving' || state.status === 'loading'

  const uploadFromInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0]
    if (file !== undefined) void controller.upload(file)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>): void => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file !== undefined) void controller.upload(file)
  }

  const patch = (config: Partial<ThemeConfig>): void => { controller.updateConfig(config) }
  const text = (key: ImageThemeKey): string => t(key)

  return (
    <section className="dsh-image-theme-section" aria-busy={busy}>
      <header className="dsh-image-theme-section__header">
        <p className="dsh-image-theme-section__eyebrow">{text('eyebrow')}</p>
        <h2>{text('title')}</h2>
        <p className="dsh-image-theme-section__intro">{text('intro')}</p>
      </header>

      {state.imageUrl === null
        ? (
          <label
            className="dsh-image-theme-section__drop"
            data-dragging={dragging}
            onDragEnter={() => { setDragging(true) }}
            onDragLeave={() => { setDragging(false) }}
            onDragOver={(event) => { event.preventDefault() }}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              disabled={busy}
              onClick={(event) => { event.currentTarget.value = '' }}
              onChange={uploadFromInput}
            />
            <span className="dsh-image-theme-section__drop-copy">
              <strong>{busy ? text('processing') : text('dropTitle')}</strong>
              <span>{text('dropHint')}</span>
            </span>
          </label>
        )
        : (
          <>
            <div
              className="dsh-image-theme-section__preview"
              style={{ backgroundImage: `url("${state.imageUrl}")` }}
              role="img"
              aria-label={state.fileName ?? text('nav')}
            >
              <div className="dsh-image-theme-section__preview-shade">
                <div className="dsh-image-theme-section__file">
                  <strong>{state.fileName}</strong>
                  <span>{text('storedLocally')}</span>
                </div>
              </div>
            </div>
            <div className="dsh-image-theme-section__toolbar">
              <label className="dsh-image-theme-section__replace">
                {text('replace')}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  disabled={busy}
                  onClick={(event) => { event.currentTarget.value = '' }}
                  onChange={uploadFromInput}
                />
              </label>
              <button
                type="button"
                className="dsh-image-theme-section__reset"
                disabled={busy}
                onClick={() => { void controller.reset() }}
              >
                {text('remove')}
              </button>
            </div>
          </>
        )}

      {state.palette === null
        ? null
        : (
          <div className="dsh-image-theme-section__controls">
            <div className="dsh-image-theme-section__toggle-row">
              <div className="dsh-image-theme-section__control-head">
                <div>
                  <h3>{text('enabledTitle')}</h3>
                  <p>{text('enabledHint')}</p>
                </div>
              </div>
              <label className="dsh-image-theme-section__toggle">
                <input
                  type="checkbox"
                  checked={state.config.enabled}
                  aria-label={text('enabledTitle')}
                  onChange={(event) => { patch({ enabled: event.currentTarget.checked }) }}
                />
                <span aria-hidden="true" />
              </label>
            </div>

            <div className="dsh-image-theme-section__controls">
              <div className="dsh-image-theme-section__control-head">
                <div>
                  <h3>{text('paletteTitle')}</h3>
                  <p>{text('paletteHint')}</p>
                </div>
              </div>
              <div className="dsh-image-theme-section__palette" aria-label={text('swatch')}>
                {state.palette.colors.map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    type="button"
                    style={{ '--swatch': color } as CSSProperties}
                    aria-label={`${text('accentLabel')} ${index + 1}: ${color}`}
                    aria-pressed={state.config.accentIndex === index}
                    onClick={() => { patch({ accentIndex: index }) }}
                  />
                ))}
              </div>
            </div>

            <div className="dsh-image-theme-section__range-grid">
              <RangeControl label={text('overlay')} value={state.config.overlay} minimum={30} maximum={85} suffix="%" onChange={(overlay) => { patch({ overlay }) }} />
              <RangeControl label={text('blur')} value={state.config.blur} minimum={0} maximum={24} suffix="px" onChange={(blur) => { patch({ blur }) }} />
              <RangeControl label={text('saturation')} value={state.config.saturation} minimum={60} maximum={160} suffix="%" onChange={(saturation) => { patch({ saturation }) }} />
              <RangeControl label={text('horizontal')} value={state.config.positionX} minimum={0} maximum={100} suffix="%" onChange={(positionX) => { patch({ positionX }) }} />
              <RangeControl label={text('vertical')} value={state.config.positionY} minimum={0} maximum={100} suffix="%" onChange={(positionY) => { patch({ positionY }) }} />
            </div>
          </div>
        )}

      <p className="dsh-image-theme-section__error" role="status" aria-live="polite">
        {state.error ?? (busy ? text('processing') : '')}
      </p>
    </section>
  )
}
