import { useMemo, useRef, useState } from 'react'
import { extractPaletteFromBlob } from '../../src/client/palette.ts'
import { createThemeRoles } from '../../src/client/theme.ts'

const DEMO_IMAGE = '/demo-background.png'
const DEMO_PALETTE = ['#0a0907', '#392718', '#8d572d', '#dfa058', '#f6ddae']

function Range({ label, value, min, max, suffix, onChange }) {
  return (
    <label className="range-control">
      <span className="range-meta"><span>{label}</span><output>{value}{suffix}</output></span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

export function App() {
  const [image, setImage] = useState(DEMO_IMAGE)
  const [fileName, setFileName] = useState('demo-background.png')
  const [palette, setPalette] = useState(DEMO_PALETTE)
  const [accentIndex, setAccentIndex] = useState(3)
  const [overlay, setOverlay] = useState(58)
  const [blur, setBlur] = useState(0)
  const [saturation, setSaturation] = useState(112)
  const [enabled, setEnabled] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const objectUrl = useRef(null)
  const roles = useMemo(() => createThemeRoles({ colors: palette }, accentIndex), [palette, accentIndex])

  async function useFile(file) {
    if (!file?.type.startsWith('image/')) return
    setBusy(true)
    try {
      const result = await extractPaletteFromBlob(file, 5)
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = URL.createObjectURL(file)
      setImage(objectUrl.current)
      setFileName(file.name)
      setPalette(result.colors)
      setAccentIndex(0)
      setEnabled(true)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = null
    setImage(DEMO_IMAGE)
    setFileName('demo-background.png')
    setPalette(DEMO_PALETTE)
    setAccentIndex(3)
    setOverlay(58)
    setBlur(0)
    setSaturation(112)
    setEnabled(true)
  }

  const themeStyle = {
    '--accent': roles.accent,
    '--surface': roles.surface,
    '--surface-rgb': '12, 10, 8',
    '--foreground': roles.foreground,
    '--secondary': roles.secondary,
  }

  return (
    <div className={`prototype ${enabled ? 'theme-enabled' : ''}`} style={themeStyle}>
      <div
        className="wallpaper"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,${overlay / 145}), rgba(0,0,0,${overlay / 112})), url("${image}")`,
          filter: `blur(${blur}px) saturate(${saturation}%)`,
          transform: `scale(${1 + blur / 250})`,
        }}
      />

      <aside className="sidebar">
        <div className="brand-row"><span className="brand-mark">DSH</span><strong>Harness</strong></div>
        <button className="new-task" type="button">新建任务</button>
        <nav aria-label="主导航">
          <a className="active" href="#workspace">工作区</a>
          <a href="#plugins">插件</a>
          <a href="#agents">Agent 预设</a>
        </nav>
        <div className="recent">
          <span className="section-label">最近任务</span>
          <button type="button">图片主题插件</button>
          <button type="button">梳理 Harness UI API</button>
        </div>
        <div className="sidebar-foot"><span>CaBeta</span><span>本地</span></div>
      </aside>

      <main className="workspace" id="workspace">
        <header className="topbar">
          <div><span className="path">~/projects/dsh-image-theme</span><strong>图片主题插件</strong></div>
          <span className="status-dot">已连接</span>
        </header>

        <section className="conversation">
          <div className="conversation-head">
            <span className="eyebrow">DSH PLUGIN · WEB</span>
            <h1>把喜欢的图片，变成<span>正在工作的界面</span></h1>
            <p>背景、玻璃层和强调色来自同一张图。主色在浏览器中提取，图片不会离开设备。</p>
          </div>

          <div className="thread">
            <div className="message-user"><span>你</span><p>用这张演唱会照片做主题，背景暗一点，强调色用暖金色。</p></div>
            <div className="message-agent">
              <span className="agent-label">DSH</span>
              <div>
                <p>主题已经应用。界面从图片中提取了 5 个主色，并为当前玻璃层校正了文字对比度。</p>
                <div className="token-line"><span>background</span><code>{roles.surface}</code></div>
                <div className="token-line"><span>accent</span><code>{roles.accent}</code></div>
              </div>
            </div>
          </div>

          <div className="composer">
            <span>继续调整这个主题…</span>
            <button type="button">发送</button>
          </div>
        </section>
      </main>

      <aside className="theme-panel" aria-label="图片主题设置">
        <header className="panel-head">
          <div><span className="eyebrow">IMAGE THEME</span><h2>图片主题</h2></div>
          <label className="switch"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /><span /></label>
        </header>
        <p className="panel-intro">上传图片后自动取色，再用遮罩和模糊控制内容可读性。</p>

        <label
          className="image-drop"
          data-dragging={dragging}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void useFile(event.dataTransfer.files[0]) }}
        >
          <input type="file" accept="image/*" onChange={(event) => void useFile(event.target.files?.[0])} />
          <span className="thumb" style={{ backgroundImage: `url("${image}")` }} />
          <span className="file-copy"><strong>{busy ? '正在分析图片…' : fileName}</strong><span>点击更换或拖入新图片</span></span>
        </label>

        <section className="panel-section">
          <div className="section-heading"><div><h3>强调色</h3><p>从图片提取，可随时切换</p></div><code>{roles.accent}</code></div>
          <div className="palette" aria-label="提取的色板">
            {palette.map((color, index) => (
              <button key={`${color}-${index}`} type="button" aria-label={`使用颜色 ${color}`} aria-pressed={accentIndex === index} style={{ backgroundColor: color }} onClick={() => setAccentIndex(index)} />
            ))}
          </div>
        </section>

        <section className="panel-section control-grid">
          <Range label="暗色遮罩" value={overlay} min={30} max={85} suffix="%" onChange={setOverlay} />
          <Range label="背景模糊" value={blur} min={0} max={24} suffix="px" onChange={setBlur} />
          <Range label="饱和度" value={saturation} min={60} max={160} suffix="%" onChange={setSaturation} />
        </section>

        <footer className="panel-foot">
          <span>仅保存在当前浏览器</span>
          <button type="button" onClick={reset}>恢复演示主题</button>
        </footer>
      </aside>
    </div>
  )
}
