export const PLUGIN_STYLES = String.raw`
[data-dsh-image-theme-backdrop] {
  position: fixed;
  inset: -32px;
  z-index: -1;
  pointer-events: none;
  background-repeat: no-repeat;
  background-size: cover;
  transform: scale(var(--dsh-image-theme-scale, 1));
  transform-origin: center;
  transition: filter 180ms ease, background-position 180ms ease, opacity 180ms ease;
}

body[data-dsh-image-theme='on'] {
  background: transparent !important;
  isolation: isolate;
}

.dsh-image-theme-section {
  width: min(100%, 760px);
  color: var(--dsw-alias-label-primary, #f8f6f2);
  padding: 8px 2px 40px;
}

.dsh-image-theme-section * {
  box-sizing: border-box;
}

.dsh-image-theme-section__header {
  margin-bottom: 28px;
}

.dsh-image-theme-section__eyebrow {
  margin: 0 0 8px;
  color: var(--dsw-alias-brand-primary, #d69b57);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.dsh-image-theme-section h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.25;
  letter-spacing: -.02em;
}

.dsh-image-theme-section__intro {
  max-width: 620px;
  margin: 10px 0 0;
  color: var(--dsw-alias-label-secondary, rgba(255,255,255,.68));
  font-size: 14px;
  line-height: 1.65;
}

.dsh-image-theme-section__preview {
  position: relative;
  min-height: 250px;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.14));
  border-radius: 18px;
  background-color: rgba(0, 0, 0, .3);
  background-position: center;
  background-size: cover;
  box-shadow: 0 22px 60px rgba(0,0,0,.24);
}

.dsh-image-theme-section__preview-shade {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 18px;
  background: linear-gradient(180deg, rgba(0,0,0,.02) 28%, rgba(0,0,0,.74));
}

.dsh-image-theme-section__file {
  min-width: 0;
}

.dsh-image-theme-section__file strong,
.dsh-image-theme-section__file span {
  display: block;
}

.dsh-image-theme-section__file strong {
  overflow: hidden;
  color: #fff;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-image-theme-section__file span {
  margin-top: 3px;
  color: rgba(255,255,255,.66);
  font-size: 12px;
}

.dsh-image-theme-section__drop {
  display: grid;
  min-height: 198px;
  place-items: center;
  border: 1px dashed var(--dsw-alias-border-l2, rgba(255,255,255,.24));
  border-radius: 18px;
  background: rgba(0,0,0,.14);
  cursor: pointer;
  text-align: center;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.dsh-image-theme-section__drop:hover,
.dsh-image-theme-section__drop[data-dragging='true'] {
  border-color: var(--dsw-alias-brand-primary, #d69b57);
  background: rgba(255,255,255,.05);
  transform: translateY(-1px);
}

.dsh-image-theme-section__drop input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.dsh-image-theme-section__drop-copy strong,
.dsh-image-theme-section__drop-copy span {
  display: block;
}

.dsh-image-theme-section__drop-copy strong {
  font-size: 15px;
}

.dsh-image-theme-section__drop-copy span {
  margin-top: 7px;
  color: var(--dsw-alias-label-secondary, rgba(255,255,255,.64));
  font-size: 12px;
}

.dsh-image-theme-section__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 14px;
}

.dsh-image-theme-section__replace,
.dsh-image-theme-section__reset {
  min-height: 36px;
  border-radius: 9px;
  padding: 0 14px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.dsh-image-theme-section__replace {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.22));
  background: rgba(255,255,255,.08);
  color: inherit;
}

.dsh-image-theme-section__replace input {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0 0 0 0);
}

.dsh-image-theme-section__reset {
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary, rgba(255,255,255,.64));
}

.dsh-image-theme-section__replace:focus-within,
.dsh-image-theme-section__reset:focus-visible,
.dsh-image-theme-section__palette button:focus-visible,
.dsh-image-theme-section input:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, #d69b57);
  outline-offset: 2px;
}

.dsh-image-theme-section__controls {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.13));
}

.dsh-image-theme-section__control-head,
.dsh-image-theme-section__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.dsh-image-theme-section__control-head h3 {
  margin: 0;
  font-size: 14px;
}

.dsh-image-theme-section__control-head p {
  margin: 4px 0 0;
  color: var(--dsw-alias-label-secondary, rgba(255,255,255,.64));
  font-size: 12px;
}

.dsh-image-theme-section__toggle {
  position: relative;
  width: 42px;
  height: 24px;
  flex: 0 0 auto;
}

.dsh-image-theme-section__toggle input {
  position: absolute;
  opacity: 0;
}

.dsh-image-theme-section__toggle span {
  position: absolute;
  inset: 0;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.22));
  border-radius: 999px;
  background: rgba(255,255,255,.12);
  cursor: pointer;
  transition: background 160ms ease;
}

.dsh-image-theme-section__toggle span::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 160ms ease;
}

.dsh-image-theme-section__toggle input:checked + span {
  background: var(--dsw-alias-brand-primary, #d69b57);
}

.dsh-image-theme-section__toggle input:checked + span::after {
  transform: translateX(18px);
}

.dsh-image-theme-section__palette {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.dsh-image-theme-section__palette button {
  width: 38px;
  height: 38px;
  border: 3px solid transparent;
  border-radius: 50%;
  background: var(--swatch);
  box-shadow: 0 0 0 1px rgba(255,255,255,.18), 0 5px 16px rgba(0,0,0,.22);
  cursor: pointer;
}

.dsh-image-theme-section__palette button[aria-pressed='true'] {
  border-color: #fff;
  box-shadow: 0 0 0 2px var(--dsw-alias-brand-primary, #d69b57), 0 5px 16px rgba(0,0,0,.28);
}

.dsh-image-theme-section__range-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 28px;
  margin-top: 26px;
}

.dsh-image-theme-section__range label,
.dsh-image-theme-section__range-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 13px;
}

.dsh-image-theme-section__range output {
  color: var(--dsw-alias-label-secondary, rgba(255,255,255,.64));
  font-variant-numeric: tabular-nums;
}

.dsh-image-theme-section__range input {
  width: 100%;
  margin-top: 12px;
  accent-color: var(--dsw-alias-brand-primary, #d69b57);
}

.dsh-image-theme-section__error {
  margin: 14px 0 0;
  color: var(--dsw-alias-state-error-primary, #ff716d);
  font-size: 13px;
}

@media (max-width: 680px) {
  .dsh-image-theme-section__range-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-dsh-image-theme-backdrop],
  .dsh-image-theme-section__drop,
  .dsh-image-theme-section__toggle span,
  .dsh-image-theme-section__toggle span::after {
    transition: none;
  }
}
`
