// Inline SVG drawings of knitting charts, rendered on the server.
// Colours come from CSS classes in src/styles/knit.css, so they follow the theme:
//   .k-mc main colour, .k-cc contrast colour, .k-grid grid lines, .k-label numbers,
//   .k-screen / .k-chrome / .k-line / .k-accent for the app mockups.

export type Chart = boolean[][]

const round = (n: number) => Math.round(n * 100) / 100
const rect = (x: number, y: number, w: number, h: number, cls: string, extra = '') =>
  `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" class="${cls}"${extra}/>`
const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// 15 x 15 eight-petal Selbu star
export const STAR: Chart = Array.from({ length: 15 }, (_, r) =>
  Array.from({ length: 15 }, (_, c) => {
    const ax = Math.abs(c - 7)
    const ay = Math.abs(r - 7)
    if (ax + ay <= 1 || (ax === ay && ax <= 2)) return false
    if ((ax <= 1 || ay <= 1) && ax + ay <= 7) return true
    return Math.abs(ax - ay) <= 1 && Math.max(ax, ay) <= 6 && ax + ay >= 4
  }),
)

// Parse a text chart: one line per round, X (or #, x, ■) = main colour, anything else = contrast.
export function parseChart(text: string): Chart {
  const rows = text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '')
  const width = Math.max(...rows.map((r) => [...r].length))
  return rows.map((r) => [...r.padEnd(width, '.')].map((ch) => 'Xx#■'.includes(ch)))
}

// Grid of cells with optional grid lines; thick lines every 5 sts counted from the bottom right.
function grid(cells: Chart, x: number, y: number, s: number, { lines = true } = {}) {
  const rows = cells.length
  const cols = cells[0].length
  let out = rect(x, y, cols * s, rows * s, 'k-cc')
  cells.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) out += rect(x + c * s, y + r * s, s, s, 'k-mc')
    }),
  )
  if (lines) {
    for (let i = 0; i <= cols; i++) {
      const thick = (cols - i) % 5 === 0 ? ' k-grid--thick' : ''
      out += `<line x1="${round(x + i * s)}" y1="${y}" x2="${round(x + i * s)}" y2="${round(y + rows * s)}" class="k-grid${thick}"/>`
    }
    for (let i = 0; i <= rows; i++) {
      const thick = (rows - i) % 5 === 0 ? ' k-grid--thick' : ''
      out += `<line x1="${x}" y1="${round(y + i * s)}" x2="${round(x + cols * s)}" y2="${round(y + i * s)}" class="k-grid${thick}"/>`
    }
  }
  return out
}

// A full chart for a pattern page: rounds numbered up the right, stitches along the bottom,
// both counted from the bottom right as knitters read them.
export function chartSvg(cells: Chart, label: string) {
  const s = 18
  const rows = cells.length
  const cols = cells[0].length
  const w = cols * s + 28
  const h = rows * s + 20
  let labels = ''
  for (let i = 1; i <= rows; i++) {
    labels += `<text x="${cols * s + 6}" y="${(rows - i) * s + 13}" class="k-label">${i}</text>`
  }
  for (let i = 1; i <= cols; i++) {
    labels += `<text x="${(cols - i) * s + s / 2}" y="${rows * s + 14}" class="k-label" text-anchor="middle">${i}</text>`
  }
  return `<svg class="knit-chart" viewBox="-1 -1 ${w + 2} ${h + 2}" role="img" aria-label="${escapeAttr(label)}">${grid(cells, 0, 0, s)}${labels}</svg>`
}

// Mockup of the knitting pattern generator: colour and tool rail beside a chart canvas.
export function knitMockup(label: string) {
  const s = 8.2
  let out = rect(0, 0, 320, 180, 'k-screen') + rect(0, 0, 54, 180, 'k-chrome')
  out += rect(12, 14, 30, 18, 'k-mc', ' rx="3"') + rect(12, 38, 30, 18, 'k-cc k-outline', ' rx="3"')
  for (let i = 0; i < 4; i++) out += rect(12, 70 + i * 22, 30, 16, 'k-screen k-outline', ' rx="3"')
  out += rect(12, 70, 30, 16, 'k-selected', ' rx="3"')
  out += `<text x="70" y="22" class="k-label">15 sts · 15 rounds · 32 sts / 10 cm</text>`
  out += grid(STAR, 66, 32, s)
  out += `<g opacity="0.45">${grid(STAR, 66 + 15 * s + 4, 32, s, { lines: false })}</g>`
  return `<svg viewBox="0 0 320 180" role="img" aria-label="${escapeAttr(label)}">${out}</svg>`
}

// Small knitted swatch for pattern cards without a photo. Each style is a different motif.
export function swatch(style: number, w = 240, h = 180) {
  const s = w / 24
  const rows = Math.ceil(h / s)
  let out = rect(0, 0, w, h, 'k-cc')
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 24; c++) {
      let on
      if (style === 0) {
        const rr = r % 8
        const cc = c % 8
        on = Math.abs(rr - 3.5) + Math.abs(cc - 3.5) <= 3.5 && (rr + cc) % 2 === 0
      } else if (style === 1) on = (r % 4 === 1 && c % 4 === 1) || (r % 4 === 3 && c % 4 === 3)
      else if (style === 2) on = c % 4 < 2
      else on = Math.abs(((c + r) % 8) - 4) === r % 4 || r % 8 === 0
      if (on) out += rect(c * s, r * s, s + 0.2, Math.min(s + 0.2, h - r * s), 'k-mc')
    }
  }
  return `<svg class="swatch" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">${out}</svg>`
}
