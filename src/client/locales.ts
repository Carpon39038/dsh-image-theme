export type ImageThemeKey =
  | 'nav' | 'eyebrow' | 'title' | 'intro' | 'dropTitle' | 'dropHint' | 'replace' | 'remove'
  | 'storedLocally' | 'enabledTitle' | 'enabledHint' | 'paletteTitle' | 'paletteHint'
  | 'accentLabel' | 'overlay' | 'blur' | 'saturation' | 'horizontal' | 'vertical'
  | 'processing' | 'swatch'

export const zh: Record<ImageThemeKey, string> = {
  nav: '图片主题',
  eyebrow: 'IMAGE THEME',
  title: '让一张图片成为整个界面的色彩来源',
  intro: '图片只保存在当前浏览器。插件会提取 5 个主色，生成深色玻璃层，并自动保护文字与强调色的对比度。',
  dropTitle: '拖入图片，或点此选择',
  dropHint: 'PNG、JPEG、WebP、AVIF · 最大 16 MB',
  replace: '更换图片',
  remove: '恢复默认主题',
  storedLocally: '保存在浏览器本地，不会上传',
  enabledTitle: '启用图片主题',
  enabledHint: '关闭后保留图片和参数，随时可以重新启用。',
  paletteTitle: '强调色',
  paletteHint: '从图片中提取，已自动校正可读性。',
  accentLabel: '使用色板颜色',
  overlay: '暗色遮罩',
  blur: '背景模糊',
  saturation: '饱和度',
  horizontal: '水平位置',
  vertical: '垂直位置',
  processing: '正在分析图片…',
  swatch: '色板',
}

export const en: Record<ImageThemeKey, string> = {
  nav: 'Image theme',
  eyebrow: 'IMAGE THEME',
  title: 'Let one image drive the color of the whole interface',
  intro: 'The image stays in this browser. The plugin extracts five dominant colors, creates dark glass surfaces, and protects text and accent contrast.',
  dropTitle: 'Drop an image here, or choose one',
  dropHint: 'PNG, JPEG, WebP, AVIF · 16 MB maximum',
  replace: 'Replace image',
  remove: 'Restore default theme',
  storedLocally: 'Stored in this browser and never uploaded',
  enabledTitle: 'Enable image theme',
  enabledHint: 'Turning it off keeps the image and settings ready to restore.',
  paletteTitle: 'Accent color',
  paletteHint: 'Extracted from the image and adjusted for readability.',
  accentLabel: 'Use palette color',
  overlay: 'Dark overlay',
  blur: 'Background blur',
  saturation: 'Saturation',
  horizontal: 'Horizontal position',
  vertical: 'Vertical position',
  processing: 'Analyzing image…',
  swatch: 'Palette',
}
