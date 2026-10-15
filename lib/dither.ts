// Shared by the dithered pictures: the page background and border (components/PageDecoration.tsx)
// and the home page's hero photo (components/HeroDither.tsx). Browser only.

// Ordered dithering: an 8 × 8 Bayer matrix of thresholds between 0 and 1
export const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((q) => (q + 0.5) / 64))

// Smooth value noise, so a wash isn't perfectly even
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
export const noise = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v
}

// A palette colour as [r, g, b]. color-mix() colours come back as color(srgb 0–1 values).
export function rgb(name: string): number[] {
  const probe = document.createElement('i')
  probe.style.color = `var(${name})`
  document.body.append(probe)
  const c = getComputedStyle(probe).color
  probe.remove()
  const m = (c.match(/[\d.]+/g) ?? ['0', '0', '0']).map(Number)
  return (c.startsWith('color(') ? m.map((v) => Math.round(v * 255)) : m).slice(0, 3)
}

// Calls `draw` again when the theme changes (the header toggle or the system); returns a cleanup
export function onThemeChange(draw: () => void) {
  const themes = new MutationObserver(draw)
  themes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  scheme.addEventListener('change', draw)
  return () => {
    themes.disconnect()
    scheme.removeEventListener('change', draw)
  }
}
