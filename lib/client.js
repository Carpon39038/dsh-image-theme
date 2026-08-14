window.__ModuleLoader__.load({
	id: "@cabeta/dsh-image-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/color.ts
		const HEX = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;
		function clamp(value, minimum = 0, maximum = 255) {
			return Math.min(maximum, Math.max(minimum, value));
		}
		function rgbToHex(color) {
			const channel = (value) => Math.round(clamp(value)).toString(16).padStart(2, "0");
			return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
		}
		function hexToRgb(value) {
			const match = HEX.exec(value);
			if (match === null) throw new Error(`Invalid RGB hex color: ${value}`);
			return {
				r: Number.parseInt(match[1] ?? "00", 16),
				g: Number.parseInt(match[2] ?? "00", 16),
				b: Number.parseInt(match[3] ?? "00", 16)
			};
		}
		function mixRgb(first, second, weight) {
			const amount = clamp(weight, 0, 1);
			return {
				r: first.r + (second.r - first.r) * amount,
				g: first.g + (second.g - first.g) * amount,
				b: first.b + (second.b - first.b) * amount
			};
		}
		function linearChannel(value) {
			const channel = clamp(value) / 255;
			return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
		}
		function relativeLuminance(color) {
			return .2126 * linearChannel(color.r) + .7152 * linearChannel(color.g) + .0722 * linearChannel(color.b);
		}
		function contrastRatio(first, second) {
			const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
			const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
			return (lighter + .05) / (darker + .05);
		}
		function ensureContrast(foreground, background, target = 4.5) {
			if (contrastRatio(foreground, background) >= target) return foreground;
			const white = {
				r: 255,
				g: 255,
				b: 255
			};
			const black = {
				r: 0,
				g: 0,
				b: 0
			};
			const destination = contrastRatio(white, background) >= contrastRatio(black, background) ? white : black;
			for (let step = 1; step <= 20; step += 1) {
				const candidate = mixRgb(foreground, destination, step / 20);
				if (contrastRatio(candidate, background) >= target) return candidate;
			}
			return destination;
		}
		function rgba(color, alpha) {
			return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${clamp(alpha, 0, 1).toFixed(3)})`;
		}
		//#endregion
		//#region src/client/palette.ts
		const MAX_SAMPLES = 6e3;
		function pivotRgb(value) {
			const channel = value / 255;
			return channel > .04045 ? ((channel + .055) / 1.055) ** 2.4 : channel / 12.92;
		}
		function pivotXyz(value) {
			return value > .008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
		}
		function rgbToLab(rgb) {
			const red = pivotRgb(rgb.r);
			const green = pivotRgb(rgb.g);
			const blue = pivotRgb(rgb.b);
			const x = pivotXyz((red * .4124 + green * .3576 + blue * .1805) / .95047);
			const y = pivotXyz(red * .2126 + green * .7152 + blue * .0722);
			const z = pivotXyz((red * .0193 + green * .1192 + blue * .9505) / 1.08883);
			return {
				l: 116 * y - 16,
				a: 500 * (x - y),
				b: 200 * (y - z)
			};
		}
		function distance(first, second) {
			return (first.l - second.l) ** 2 + (first.a - second.a) ** 2 + (first.b - second.b) ** 2;
		}
		function nearest(lab, centroids) {
			let index = 0;
			let closest = Number.POSITIVE_INFINITY;
			for (let candidate = 0; candidate < centroids.length; candidate += 1) {
				const centroid = centroids[candidate];
				if (centroid === void 0) continue;
				const current = distance(lab, centroid);
				if (current < closest) {
					closest = current;
					index = candidate;
				}
			}
			return index;
		}
		function seedCentroids(samples, count) {
			const average = samples.reduce((sum, sample) => ({
				l: sum.l + sample.lab.l / samples.length,
				a: sum.a + sample.lab.a / samples.length,
				b: sum.b + sample.lab.b / samples.length
			}), {
				l: 0,
				a: 0,
				b: 0
			});
			const centroids = [{ ...samples.reduce((best, sample) => distance(sample.lab, average) < distance(best.lab, average) ? sample : best).lab }];
			while (centroids.length < count) {
				const next = samples.reduce((farthest, sample) => {
					const score = Math.min(...centroids.map((centroid) => distance(sample.lab, centroid)));
					return score > farthest.score ? {
						sample,
						score
					} : farthest;
				}, {
					sample: samples[0],
					score: -1
				});
				centroids.push({ ...next.sample.lab });
			}
			return centroids;
		}
		function cluster(samples, count) {
			let centroids = seedCentroids(samples, count);
			const assignments = new Uint8Array(samples.length);
			for (let iteration = 0; iteration < 18; iteration += 1) {
				const totals = Array.from({ length: count }, () => ({
					l: 0,
					a: 0,
					b: 0,
					count: 0
				}));
				samples.forEach((sample, sampleIndex) => {
					const index = nearest(sample.lab, centroids);
					assignments[sampleIndex] = index;
					const total = totals[index];
					if (total === void 0) return;
					total.l += sample.lab.l;
					total.a += sample.lab.a;
					total.b += sample.lab.b;
					total.count += 1;
				});
				const next = totals.map((total, index) => total.count === 0 ? centroids[index] : {
					l: total.l / total.count,
					a: total.a / total.count,
					b: total.b / total.count
				});
				const movement = next.reduce((sum, centroid, index) => sum + distance(centroid, centroids[index]), 0);
				centroids = next;
				if (movement < .01) break;
			}
			const totals = Array.from({ length: count }, () => ({
				r: 0,
				g: 0,
				b: 0,
				count: 0
			}));
			samples.forEach((sample, index) => {
				const total = totals[assignments[index] ?? 0];
				if (total === void 0) return;
				total.r += sample.rgb.r;
				total.g += sample.rgb.g;
				total.b += sample.rgb.b;
				total.count += 1;
			});
			return totals.map((total, index) => ({
				centroid: centroids[index],
				count: total.count,
				rgb: total.count === 0 ? samples[index % samples.length]?.rgb ?? {
					r: 16,
					g: 16,
					b: 16
				} : {
					r: total.r / total.count,
					g: total.g / total.count,
					b: total.b / total.count
				}
			})).sort((first, second) => second.count - first.count);
		}
		function extractPaletteFromPixels(data, colorCount = 5) {
			const pixelCount = Math.floor(data.length / 4);
			if (pixelCount === 0) throw new Error("The image has no readable pixels.");
			const stride = Math.max(1, Math.ceil(pixelCount / MAX_SAMPLES));
			const samples = [];
			for (let pixel = 0; pixel < pixelCount; pixel += stride) {
				const offset = pixel * 4;
				if ((data[offset + 3] ?? 255) < 160) continue;
				const rgb = {
					r: data[offset] ?? 0,
					g: data[offset + 1] ?? 0,
					b: data[offset + 2] ?? 0
				};
				samples.push({
					rgb,
					lab: rgbToLab(rgb)
				});
			}
			if (samples.length === 0) throw new Error("The image is fully transparent.");
			const colors = cluster(samples, Math.max(1, Math.min(colorCount, samples.length))).map((result) => rgbToHex(result.rgb));
			while (colors.length < colorCount) {
				const source = hexToRgb(colors[colors.length % Math.max(colors.length, 1)] ?? "#202020");
				colors.push(rgbToHex(mixRgb(source, {
					r: 255,
					g: 255,
					b: 255
				}, .18 + colors.length * .06)));
			}
			return { colors };
		}
		async function decodeImage(blob) {
			if ("createImageBitmap" in globalThis) {
				const bitmap = await createImageBitmap(blob);
				return {
					source: bitmap,
					width: bitmap.width,
					height: bitmap.height,
					cleanup: () => {
						bitmap.close();
					}
				};
			}
			const url = URL.createObjectURL(blob);
			const image = new Image();
			image.decoding = "async";
			image.src = url;
			await image.decode();
			return {
				source: image,
				width: image.naturalWidth,
				height: image.naturalHeight,
				cleanup: () => {
					URL.revokeObjectURL(url);
				}
			};
		}
		async function extractPaletteFromBlob(blob, colorCount = 5) {
			const decoded = await decodeImage(blob);
			try {
				const scale = Math.min(1, 96 / Math.max(decoded.width, decoded.height));
				const canvas = document.createElement("canvas");
				canvas.width = Math.max(1, Math.round(decoded.width * scale));
				canvas.height = Math.max(1, Math.round(decoded.height * scale));
				const context = canvas.getContext("2d", { willReadFrequently: true });
				if (context === null) throw new Error("Canvas color extraction is not available.");
				context.imageSmoothingEnabled = true;
				context.imageSmoothingQuality = "high";
				context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
				return extractPaletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data, colorCount);
			} finally {
				decoded.cleanup();
			}
		}
		function darkestPaletteColor(palette) {
			return palette.colors.reduce((darkest, color) => relativeLuminance(hexToRgb(color)) < relativeLuminance(hexToRgb(darkest)) ? color : darkest, palette.colors[0] ?? "#151515");
		}
		//#endregion
		//#region src/client/types.ts
		const DEFAULT_CONFIG = Object.freeze({
			enabled: true,
			overlay: 58,
			blur: 0,
			saturation: 112,
			positionX: 50,
			positionY: 50,
			accentIndex: 0
		});
		//#endregion
		//#region src/client/storage.ts
		const DATABASE = "dsh-image-theme";
		const STORE = "assets";
		const IMAGE_KEY = "background";
		const SETTINGS_KEY = "dsh-image-theme/settings-v1";
		function openDatabase() {
			return new Promise((resolve, reject) => {
				const request = indexedDB.open(DATABASE, 1);
				request.onupgradeneeded = () => {
					const database = request.result;
					if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
				};
				request.onsuccess = () => {
					resolve(request.result);
				};
				request.onerror = () => {
					reject(request.error ?? /* @__PURE__ */ new Error("Could not open image storage."));
				};
			});
		}
		async function withStore(mode, action) {
			const database = await openDatabase();
			try {
				return await new Promise((resolve, reject) => {
					const request = action(database.transaction(STORE, mode).objectStore(STORE));
					request.onsuccess = () => {
						resolve(request.result);
					};
					request.onerror = () => {
						reject(request.error ?? /* @__PURE__ */ new Error("Image storage operation failed."));
					};
				});
			} finally {
				database.close();
			}
		}
		function readThemeSettings() {
			const raw = localStorage.getItem(SETTINGS_KEY);
			if (raw === null) return null;
			try {
				const value = JSON.parse(raw);
				if (value.version !== 1 || typeof value.fileName !== "string" || !Array.isArray(value.palette?.colors)) return null;
				return {
					version: 1,
					fileName: value.fileName,
					palette: { colors: value.palette.colors.filter((color) => typeof color === "string").slice(0, 5) },
					config: {
						...DEFAULT_CONFIG,
						...value.config
					}
				};
			} catch {
				return null;
			}
		}
		function writeThemeSettings(value) {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
		}
		function clearThemeSettings() {
			localStorage.removeItem(SETTINGS_KEY);
		}
		async function readBackgroundImage() {
			return withStore("readonly", (store) => store.get(IMAGE_KEY)).then((value) => value ?? null);
		}
		async function writeBackgroundImage(blob) {
			await withStore("readwrite", (store) => store.put(blob, IMAGE_KEY));
		}
		async function clearBackgroundImage() {
			await withStore("readwrite", (store) => store.delete(IMAGE_KEY));
		}
		//#endregion
		//#region src/client/styles.ts
		const PLUGIN_STYLES = String.raw`
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
`;
		//#endregion
		//#region src/client/theme.ts
		const black = {
			r: 0,
			g: 0,
			b: 0
		};
		const white = {
			r: 250,
			g: 248,
			b: 244
		};
		function pair(value) {
			return {
				light: value,
				dark: value
			};
		}
		function createThemeRoles(palette, accentIndex) {
			const surface = mixRgb(hexToRgb(darkestPaletteColor(palette)), black, .62);
			const accent = ensureContrast(hexToRgb(palette.colors[accentIndex] ?? palette.colors[0] ?? "#d79a54"), surface, 3.2);
			const foreground = ensureContrast(white, surface, 7);
			return {
				surface: rgbToHex(surface),
				accent: rgbToHex(accent),
				foreground: rgbToHex(foreground),
				secondary: rgbToHex(mixRgb(foreground, surface, .34))
			};
		}
		function buildThemeTokens(palette, config) {
			const roles = createThemeRoles(palette, config.accentIndex);
			const surface = hexToRgb(roles.surface);
			const foreground = hexToRgb(roles.foreground);
			const strength = config.overlay / 100;
			return {
				"--dsw-alias-bg-base": pair(rgba(surface, .58 + strength * .24)),
				"--dsw-alias-bg-layer-1": pair(rgba(mixRgb(surface, white, .04), .66 + strength * .22)),
				"--dsw-alias-bg-layer-2": pair(rgba(mixRgb(surface, white, .08), .7 + strength * .2)),
				"--dsw-alias-bg-overlay": pair(rgba(surface, .9 + strength * .08)),
				"--dsw-alias-border-l1": pair(rgba(foreground, .12)),
				"--dsw-alias-border-l2": pair(rgba(foreground, .22)),
				"--dsw-alias-brand-primary": pair(roles.accent),
				"--dsw-alias-label-primary": pair(roles.foreground),
				"--dsw-alias-label-secondary": pair(roles.secondary),
				"--dsw-specific-sidebar-fill": pair(rgba(surface, .54 + strength * .24))
			};
		}
		//#endregion
		//#region src/client/controller.ts
		const SOURCE = "@cabeta/dsh-image-theme";
		const MAX_IMAGE_BYTES = 16777216;
		var ImageThemeController = class {
			state = {
				status: "loading",
				imageUrl: null,
				fileName: null,
				palette: null,
				config: { ...DEFAULT_CONFIG },
				error: null
			};
			listeners = /* @__PURE__ */ new Set();
			theme;
			themeDispose;
			styleElement;
			backdrop;
			operation = 0;
			constructor(theme) {
				this.theme = theme;
			}
			getSnapshot = () => this.state;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			start() {
				this.ensureDom();
				this.hydrate();
				return () => {
					this.dispose();
				};
			}
			publish(next) {
				this.state = next;
				for (const listener of this.listeners) listener();
			}
			ensureDom() {
				if (this.styleElement === void 0) {
					const style = document.createElement("style");
					style.dataset.plugin = SOURCE;
					style.textContent = PLUGIN_STYLES;
					document.head.appendChild(style);
					this.styleElement = style;
				}
				if (this.backdrop === void 0) {
					const backdrop = document.createElement("div");
					backdrop.dataset.dshImageThemeBackdrop = "";
					backdrop.setAttribute("aria-hidden", "true");
					(document.body ?? document.documentElement).prepend(backdrop);
					this.backdrop = backdrop;
				}
			}
			async hydrate() {
				const revision = ++this.operation;
				try {
					const saved = readThemeSettings();
					if (saved === null) {
						if (revision === this.operation) this.publish({
							...this.state,
							status: "empty"
						});
						return;
					}
					const blob = await readBackgroundImage();
					if (revision !== this.operation) return;
					if (blob === null) {
						clearThemeSettings();
						this.publish({
							...this.state,
							status: "empty"
						});
						return;
					}
					const imageUrl = URL.createObjectURL(blob);
					this.publish({
						status: "ready",
						imageUrl,
						fileName: saved.fileName,
						palette: saved.palette,
						config: saved.config,
						error: null
					});
					this.present();
				} catch (error) {
					if (revision !== this.operation) return;
					this.publish({
						...this.state,
						status: "error",
						error: messageOf(error)
					});
				}
			}
			upload = async (file) => {
				if (!file.type.startsWith("image/")) {
					this.publish({
						...this.state,
						error: "请选择 PNG、JPEG、WebP 或 AVIF 图片。"
					});
					return;
				}
				if (file.size > MAX_IMAGE_BYTES) {
					this.publish({
						...this.state,
						error: "图片不能超过 16 MB。"
					});
					return;
				}
				const revision = ++this.operation;
				const previous = this.state;
				this.publish({
					...previous,
					status: "saving",
					error: null
				});
				try {
					const palette = await extractPaletteFromBlob(file, 5);
					await writeBackgroundImage(file);
					if (revision !== this.operation) return;
					const config = {
						...previous.config,
						enabled: true,
						accentIndex: 0
					};
					writeThemeSettings({
						version: 1,
						fileName: file.name,
						palette,
						config
					});
					if (previous.imageUrl !== null) URL.revokeObjectURL(previous.imageUrl);
					this.publish({
						status: "ready",
						imageUrl: URL.createObjectURL(file),
						fileName: file.name,
						palette,
						config,
						error: null
					});
					this.present();
				} catch (error) {
					if (revision !== this.operation) return;
					this.publish({
						...previous,
						status: previous.imageUrl === null ? "error" : "ready",
						error: messageOf(error)
					});
				}
			};
			updateConfig = (patch) => {
				const config = {
					...this.state.config,
					...patch
				};
				if (this.state.palette !== null && this.state.fileName !== null) {
					config.accentIndex = Math.max(0, Math.min(this.state.palette.colors.length - 1, config.accentIndex));
					writeThemeSettings({
						version: 1,
						fileName: this.state.fileName,
						palette: this.state.palette,
						config
					});
				}
				this.publish({
					...this.state,
					config,
					error: null
				});
				this.present();
			};
			reset = async () => {
				const revision = ++this.operation;
				this.publish({
					...this.state,
					status: "saving",
					error: null
				});
				try {
					await clearBackgroundImage();
					if (revision !== this.operation) return;
					clearThemeSettings();
					if (this.state.imageUrl !== null) URL.revokeObjectURL(this.state.imageUrl);
					this.publish({
						status: "empty",
						imageUrl: null,
						fileName: null,
						palette: null,
						config: { ...DEFAULT_CONFIG },
						error: null
					});
					this.present();
				} catch (error) {
					if (revision !== this.operation) return;
					this.publish({
						...this.state,
						status: "error",
						error: messageOf(error)
					});
				}
			};
			present() {
				this.ensureDom();
				if (!(this.state.config.enabled && this.state.imageUrl !== null && this.state.palette !== null)) {
					this.themeDispose?.();
					this.themeDispose = void 0;
					if (this.backdrop !== void 0) this.backdrop.style.opacity = "0";
					document.body?.removeAttribute("data-dsh-image-theme");
					return;
				}
				const previousDispose = this.themeDispose;
				this.themeDispose = this.theme.overrideTokens(SOURCE, buildThemeTokens(this.state.palette, this.state.config));
				previousDispose?.();
				const backdrop = this.backdrop;
				if (backdrop !== void 0) {
					const overlay = Math.min(.78, this.state.config.overlay / 100 * .72);
					backdrop.style.opacity = "1";
					backdrop.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, ${overlay}), rgba(0, 0, 0, ${Math.min(.88, overlay + .12)})), url("${this.state.imageUrl}")`;
					backdrop.style.backgroundPosition = `${this.state.config.positionX}% ${this.state.config.positionY}%`;
					backdrop.style.filter = `blur(${this.state.config.blur}px) saturate(${this.state.config.saturation}%)`;
					backdrop.style.setProperty("--dsh-image-theme-scale", String(1 + this.state.config.blur / 220));
				}
				document.body?.setAttribute("data-dsh-image-theme", "on");
			}
			dispose() {
				++this.operation;
				this.themeDispose?.();
				this.themeDispose = void 0;
				if (this.state.imageUrl !== null) URL.revokeObjectURL(this.state.imageUrl);
				this.backdrop?.remove();
				this.backdrop = void 0;
				this.styleElement?.remove();
				this.styleElement = void 0;
				document.body?.removeAttribute("data-dsh-image-theme");
			}
		};
		function messageOf(error) {
			return error instanceof Error ? error.message : "无法处理这张图片。";
		}
		//#endregion
		//#region src/client/ImageThemeSection.tsx
		function RangeControl({ label, value, minimum, maximum, suffix, onChange }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-image-theme-section__range",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("output", { children: [value, suffix] })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "range",
					min: minimum,
					max: maximum,
					value,
					"aria-label": label,
					onChange: (event) => {
						onChange(Number(event.currentTarget.value));
					}
				})]
			});
		}
		function ImageThemeSection({ controller, t }) {
			const state = (0, react.useSyncExternalStore)(controller.subscribe, controller.getSnapshot);
			const [dragging, setDragging] = (0, react.useState)(false);
			const busy = state.status === "saving" || state.status === "loading";
			const uploadFromInput = (event) => {
				const file = event.currentTarget.files?.[0];
				if (file !== void 0) controller.upload(file);
			};
			const onDrop = (event) => {
				event.preventDefault();
				setDragging(false);
				const file = event.dataTransfer.files[0];
				if (file !== void 0) controller.upload(file);
			};
			const patch = (config) => {
				controller.updateConfig(config);
			};
			const text = (key) => t(key);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dsh-image-theme-section",
				"aria-busy": busy,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "dsh-image-theme-section__header",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dsh-image-theme-section__eyebrow",
								children: text("eyebrow")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: text("title") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dsh-image-theme-section__intro",
								children: text("intro")
							})
						]
					}),
					state.imageUrl === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: "dsh-image-theme-section__drop",
						"data-dragging": dragging,
						onDragEnter: () => {
							setDragging(true);
						},
						onDragLeave: () => {
							setDragging(false);
						},
						onDragOver: (event) => {
							event.preventDefault();
						},
						onDrop,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "image/png,image/jpeg,image/webp,image/avif",
							disabled: busy,
							onClick: (event) => {
								event.currentTarget.value = "";
							},
							onChange: uploadFromInput
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsh-image-theme-section__drop-copy",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: busy ? text("processing") : text("dropTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: text("dropHint") })]
						})]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-image-theme-section__preview",
						style: { backgroundImage: `url("${state.imageUrl}")` },
						role: "img",
						"aria-label": state.fileName ?? text("nav"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-image-theme-section__preview-shade",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-image-theme-section__file",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: state.fileName }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: text("storedLocally") })]
							})
						})
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-image-theme-section__toolbar",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: "dsh-image-theme-section__replace",
							children: [text("replace"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "image/png,image/jpeg,image/webp,image/avif",
								disabled: busy,
								onClick: (event) => {
									event.currentTarget.value = "";
								},
								onChange: uploadFromInput
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-image-theme-section__reset",
							disabled: busy,
							onClick: () => {
								controller.reset();
							},
							children: text("remove")
						})]
					})] }),
					state.palette === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-image-theme-section__controls",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-image-theme-section__toggle-row",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-image-theme-section__control-head",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: text("enabledTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: text("enabledHint") })] })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dsh-image-theme-section__toggle",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: state.config.enabled,
										"aria-label": text("enabledTitle"),
										onChange: (event) => {
											patch({ enabled: event.currentTarget.checked });
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { "aria-hidden": "true" })]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-image-theme-section__controls",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-image-theme-section__control-head",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: text("paletteTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: text("paletteHint") })] })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-image-theme-section__palette",
									"aria-label": text("swatch"),
									children: state.palette.colors.map((color, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: { "--swatch": color },
										"aria-label": `${text("accentLabel")} ${index + 1}: ${color}`,
										"aria-pressed": state.config.accentIndex === index,
										onClick: () => {
											patch({ accentIndex: index });
										}
									}, `${color}-${index}`))
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-image-theme-section__range-grid",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RangeControl, {
										label: text("overlay"),
										value: state.config.overlay,
										minimum: 30,
										maximum: 85,
										suffix: "%",
										onChange: (overlay) => {
											patch({ overlay });
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RangeControl, {
										label: text("blur"),
										value: state.config.blur,
										minimum: 0,
										maximum: 24,
										suffix: "px",
										onChange: (blur) => {
											patch({ blur });
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RangeControl, {
										label: text("saturation"),
										value: state.config.saturation,
										minimum: 60,
										maximum: 160,
										suffix: "%",
										onChange: (saturation) => {
											patch({ saturation });
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RangeControl, {
										label: text("horizontal"),
										value: state.config.positionX,
										minimum: 0,
										maximum: 100,
										suffix: "%",
										onChange: (positionX) => {
											patch({ positionX });
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RangeControl, {
										label: text("vertical"),
										value: state.config.positionY,
										minimum: 0,
										maximum: 100,
										suffix: "%",
										onChange: (positionY) => {
											patch({ positionY });
										}
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dsh-image-theme-section__error",
						role: "status",
						"aria-live": "polite",
						children: state.error ?? (busy ? text("processing") : "")
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const zh = {
			nav: "图片主题",
			eyebrow: "IMAGE THEME",
			title: "让一张图片成为整个界面的色彩来源",
			intro: "图片只保存在当前浏览器。插件会提取 5 个主色，生成深色玻璃层，并自动保护文字与强调色的对比度。",
			dropTitle: "拖入图片，或点此选择",
			dropHint: "PNG、JPEG、WebP、AVIF · 最大 16 MB",
			replace: "更换图片",
			remove: "恢复默认主题",
			storedLocally: "保存在浏览器本地，不会上传",
			enabledTitle: "启用图片主题",
			enabledHint: "关闭后保留图片和参数，随时可以重新启用。",
			paletteTitle: "强调色",
			paletteHint: "从图片中提取，已自动校正可读性。",
			accentLabel: "使用色板颜色",
			overlay: "暗色遮罩",
			blur: "背景模糊",
			saturation: "饱和度",
			horizontal: "水平位置",
			vertical: "垂直位置",
			processing: "正在分析图片…",
			swatch: "色板"
		};
		const en = {
			nav: "Image theme",
			eyebrow: "IMAGE THEME",
			title: "Let one image drive the color of the whole interface",
			intro: "The image stays in this browser. The plugin extracts five dominant colors, creates dark glass surfaces, and protects text and accent contrast.",
			dropTitle: "Drop an image here, or choose one",
			dropHint: "PNG, JPEG, WebP, AVIF · 16 MB maximum",
			replace: "Replace image",
			remove: "Restore default theme",
			storedLocally: "Stored in this browser and never uploaded",
			enabledTitle: "Enable image theme",
			enabledHint: "Turning it off keeps the image and settings ready to restore.",
			paletteTitle: "Accent color",
			paletteHint: "Extracted from the image and adjusted for readability.",
			accentLabel: "Use palette color",
			overlay: "Dark overlay",
			blur: "Background blur",
			saturation: "Saturation",
			horizontal: "Horizontal position",
			vertical: "Vertical position",
			processing: "Analyzing image…",
			swatch: "Palette"
		};
		//#endregion
		//#region src/client/index.ts
		const NS = "settings.imageTheme";
		const inject = [
			"slots",
			"locale",
			"theme"
		];
		function apply(ctx) {
			const controller = new ImageThemeController(ctx.theme);
			const injected = () => ({ controller });
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "image-theme: locale dictionaries");
			ctx.effect(() => controller.start(), "image-theme: background and token presenter");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "image-theme",
				order: 35,
				label: () => ctx.locale.bind(NS)("nav"),
				locale: NS,
				inject: injected
			}, ImageThemeSection));
		}
		//#endregion
		exports.apply = apply;
		exports.buildThemeTokens = buildThemeTokens;
		exports.createThemeRoles = createThemeRoles;
		exports.extractPaletteFromBlob = extractPaletteFromBlob;
		exports.extractPaletteFromPixels = extractPaletteFromPixels;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map