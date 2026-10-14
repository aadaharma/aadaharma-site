// The designer's canvas: draws the pattern and turns pointer, touch and keyboard input
// into edits. The grid scrolls inside `host` with real scrollbars; the canvas covers only
// the visible part and draws only what's in view, so big grids stay fast.
// The page around it (Designer.tsx) reads its state through subscribe()/getState().
import { DESIGN_MAX, isOneColour, placeMotif, type Motif, type Size } from '@/lib/embroidery/motif'
import type { Pattern } from '@/lib/embroidery/pattern'
import {
  clearRegion, extract, inRegion, mirrorHorizontal, mirrorVertical, recolourRegion, regionBetween, rework, rotateClockwise,
  translate, type Region,
} from '@/lib/embroidery/regions'
import { SHAPES, type Shape } from '@/lib/embroidery/shapes'
import {
  cellAt, parseKey, penStep, pointsBetween, stitchesAlong, stitchesNear, type Key, type Point, type Stitches,
} from '@/lib/embroidery/stitches'
import { drawFabric, drawStitches, LINEN } from './draw'

export type Tool = 'pen' | 'shape' | 'erase' | 'select' | 'pan' | 'place'

// A template or a copied piece following the pointer until it's placed
type Placing = { motif: Motif; kind: 'template' | 'paste'; name: string; recolour: boolean; at: Point }

export type EditorState = {
  tool: Tool
  shape: Shape
  colour: string
  zoom: number
  width: number
  height: number
  selection: Region | null
  selectionCount: number
  placing: { kind: 'template' | 'paste'; name: string; width: number; height: number } | null
  hasClipboard: boolean
  canUndo: boolean
  canRedo: boolean
  isEmpty: boolean
}

type Gesture =
  | { type: 'pen'; last: Point; start: Point; added: number }
  | { type: 'shape'; last: Point }
  | { type: 'erase'; last: Point }
  | { type: 'select'; start: Point; from: Point; rect: Region | null }
  | { type: 'move'; start: Point; rect: Region; piece: Stitches; dx: number; dy: number }
  | { type: 'pan'; x: number; y: number; left: number; top: number }
  | { type: 'pinch'; distance: number; zoom: number; gx: number; gy: number }
  | { type: 'place' }

const BASE_CELL = 20 // pixels per cell at 100 %
const MIN_CELL = 5
const MAX_CELL = 64
const CURSORS: Record<Tool, string> = { pen: 'crosshair', shape: 'cell', erase: 'crosshair', select: 'default', pan: 'grab', place: 'copy' }

export class Editor {
  tool: Tool = 'pen'
  shape: Shape = 'square'
  colour: string
  zoom = 1.1
  selection: Region | null = null
  private placing: Placing | null = null
  private clipboard: Stitches | null = null
  private clipboardSize = { width: 0, height: 0 }

  private scroller: HTMLDivElement
  private spacer: HTMLDivElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private colours = { surround: '#ecdcc6', accent: '#a3401c', shadow: 'rgb(80 40 10 / 0.22)', fabric: LINEN }
  private offset = { x: 32, y: 32 } // where the grid starts inside the scrolled area
  private view = { width: 0, height: 0, dpr: 1 }
  private hover: Point | null = null // pointer position in cells
  private gesture: Gesture | null = null
  private touches = new Map<number, { x: number; y: number }>()
  private spaceHeld = false
  private frame = 0
  private listeners = new Set<() => void>()
  private snapshot: EditorState | null = null
  private cleanup: (() => void)[] = []

  constructor(
    host: HTMLElement,
    public pattern: Pattern,
    colour: string,
    // Short messages for the page to show, e.g. after copying with Ctrl+C
    private notify: (message: 'copied') => void = () => {},
    // The largest grid size allowed
    private maxSize: Size = DESIGN_MAX,
  ) {
    this.colour = colour
    this.scroller = document.createElement('div')
    this.scroller.className = 'ke-scroller'
    this.scroller.tabIndex = 0
    this.spacer = document.createElement('div')
    this.spacer.className = 'ke-spacer'
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'ke-canvas'
    this.scroller.append(this.spacer)
    host.append(this.scroller, this.canvas)
    this.ctx = this.canvas.getContext('2d')!

    this.cleanup.push(pattern.subscribe(() => this.changed()))
    this.readColours(host)
    const themeObserver = new MutationObserver(() => this.readColours(host))
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const dark = window.matchMedia('(prefers-color-scheme: dark)')
    const onScheme = () => this.readColours(host)
    dark.addEventListener('change', onScheme)
    const resizeObserver = new ResizeObserver(() => this.layout())
    resizeObserver.observe(host)
    this.cleanup.push(
      () => themeObserver.disconnect(),
      () => dark.removeEventListener('change', onScheme),
      () => resizeObserver.disconnect(),
      () => host.replaceChildren(),
    )
    this.listen()
    this.setTool('pen')
    this.layout()
  }

  destroy() {
    cancelAnimationFrame(this.frame)
    for (const fn of this.cleanup) fn()
  }

  // ----- state for the page -----

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => void this.listeners.delete(fn)
  }

  getState = (): EditorState => {
    this.snapshot ??= {
      tool: this.tool,
      shape: this.shape,
      colour: this.colour,
      zoom: this.zoom,
      width: this.pattern.width,
      height: this.pattern.height,
      selection: this.selection,
      selectionCount: this.selection ? this.selectionStitches().size : 0,
      placing: this.placing && {
        kind: this.placing.kind,
        name: this.placing.name,
        width: this.placing.motif.width,
        height: this.placing.motif.height,
      },
      hasClipboard: !!this.clipboard,
      canUndo: this.pattern.canUndo,
      canRedo: this.pattern.canRedo,
      isEmpty: this.pattern.stitches.size === 0,
    }
    return this.snapshot
  }

  private changed() {
    this.snapshot = null
    for (const fn of this.listeners) fn()
    this.redraw()
  }

  // ----- tools and actions -----

  setTool(tool: Tool) {
    if (tool !== 'place') this.placing = null
    if (tool !== 'select') this.selection = null
    this.tool = tool
    this.scroller.style.cursor = CURSORS[tool]
    this.changed()
  }

  setShape(shape: Shape) {
    this.shape = shape
    this.setTool('shape')
  }

  setColour(colour: string) {
    this.colour = colour
    this.changed()
  }

  undo() {
    if (!this.gesture) this.pattern.undo()
  }

  redo() {
    if (!this.gesture) this.pattern.redo()
  }

  clear() {
    this.pattern.clear()
  }

  resize(width: number, height: number) {
    const fit = (n: number, max: number) => Math.max(4, Math.min(max, Math.round(n) || 4))
    this.selection = null
    this.pattern.resize(fit(width, this.maxSize.width), fit(height, this.maxSize.height))
    this.layout()
    return { width: this.pattern.width, height: this.pattern.height }
  }

  selectAll() {
    this.setTool('select')
    this.select({ x: 0, y: 0, width: this.pattern.width, height: this.pattern.height })
  }

  select(region: Region | null) {
    this.selection = region
    this.changed()
  }

  private selectionStitches() {
    return this.selection ? extract(this.pattern.stitches, this.selection) : new Map()
  }

  recolourSelection() {
    if (this.selection) recolourRegion(this.pattern, this.selection, this.colour)
  }

  deleteSelection() {
    if (this.selection) clearRegion(this.pattern, this.selection)
  }

  copySelection() {
    if (!this.selection) return false
    this.clipboard = this.selectionStitches()
    this.clipboardSize = { width: this.selection.width, height: this.selection.height }
    this.changed()
    return true
  }

  cutSelection() {
    if (this.copySelection()) {
      this.deleteSelection()
      this.select(null)
    }
  }

  paste() {
    if (!this.clipboard) return
    this.startPlacing({ ...this.clipboardSize, stitches: this.clipboard }, '', 'paste')
  }

  mirrorSelection(axis: 'horizontal' | 'vertical') {
    const s = this.selection
    if (!s) return
    rework(this.pattern, s, (piece) => (axis === 'horizontal' ? mirrorHorizontal(piece, s.width) : mirrorVertical(piece, s.height)))
  }

  nudgeSelection(dx: number, dy: number) {
    const s = this.selection
    if (!s) return
    dx = Math.max(-s.x, Math.min(this.pattern.width - s.x - s.width, dx))
    dy = Math.max(-s.y, Math.min(this.pattern.height - s.y - s.height, dy))
    if (!dx && !dy) return
    rework(this.pattern, s, undefined, dx, dy)
    this.select({ ...s, x: s.x + dx, y: s.y + dy })
  }


  // One-colour templates are stitched in the current colour; pasted pieces and
  // multicoloured templates keep their own colours
  startPlacing(motif: Motif, name: string, kind: 'template' | 'paste' = 'template') {
    const centre = this.toGrid(this.view.width / 2, this.view.height / 2)
    const at = { x: Math.round(centre.x - motif.width / 2), y: Math.round(centre.y - motif.height / 2) }
    this.selection = null
    this.tool = 'place'
    this.placing = { motif, kind, name, recolour: kind === 'template' && isOneColour(motif), at }
    this.scroller.style.cursor = CURSORS.place
    this.changed()
  }

  stopPlacing() {
    this.setTool(this.placing?.kind === 'paste' ? 'select' : 'pen')
  }

  rotatePlacing() {
    this.transformPlacing((m) => ({ width: m.height, height: m.width, stitches: rotateClockwise(m.stitches, m.height) }))
  }

  mirrorPlacing(axis: 'horizontal' | 'vertical') {
    this.transformPlacing((m) => ({
      ...m,
      stitches: axis === 'horizontal' ? mirrorHorizontal(m.stitches, m.width) : mirrorVertical(m.stitches, m.height),
    }))
  }

  private transformPlacing(fn: (m: Motif) => Motif) {
    if (!this.placing) return
    this.placing = { ...this.placing, motif: fn(this.placing.motif) }
    this.changed()
  }

  // ----- zoom and layout -----

  private cell = () => BASE_CELL * this.zoom

  setZoom(zoom: number, anchor?: { x: number; y: number }) {
    zoom = Math.max(MIN_CELL / BASE_CELL, Math.min(MAX_CELL / BASE_CELL, zoom))
    if (Math.abs(zoom - this.zoom) < 1e-4) return
    // Keep the grid point under the anchor (the pointer, or the middle) where it is
    const a = anchor ?? { x: this.view.width / 2, y: this.view.height / 2 }
    const g = this.toGrid(a.x, a.y)
    this.zoom = zoom
    this.layout()
    this.scroller.scrollLeft = g.x * this.cell() + this.offset.x - a.x
    this.scroller.scrollTop = g.y * this.cell() + this.offset.y - a.y
    this.changed()
  }

  zoomIn = () => this.setZoom(this.zoom * 1.25)
  zoomOut = () => this.setZoom(this.zoom / 1.25)

  fit = () => {
    const { width, height } = this.pattern
    const pad = this.padding()
    // A pixel to spare, so rounding doesn't bring back the scrollbars
    const fits = Math.min(
      (this.scroller.clientWidth - 2 * pad - 1) / (width * BASE_CELL),
      (this.scroller.clientHeight - 2 * pad - 1) / (height * BASE_CELL),
    )
    this.zoom = Math.max(MIN_CELL / BASE_CELL, Math.min(MAX_CELL / BASE_CELL, fits))
    this.layout()
    this.scroller.scrollLeft = 0
    this.scroller.scrollTop = 0
    this.changed()
  }

  // Space around the grid
  private padding = () => Math.min(40, Math.max(16, this.scroller.clientWidth * 0.04))

  // Sizes the scrolled area to the grid (centred when it fits) and the canvas to the view
  private layout() {
    const width = this.scroller.clientWidth
    const height = this.scroller.clientHeight
    const dpr = window.devicePixelRatio || 1
    this.view = { width, height, dpr }
    const c = this.cell()
    const gw = this.pattern.width * c
    const gh = this.pattern.height * c
    const pad = this.padding()
    this.offset = { x: gw + 2 * pad <= width ? (width - gw) / 2 : pad, y: gh + 2 * pad <= height ? (height - gh) / 2 : pad }
    this.spacer.style.width = `${Math.floor(gw + 2 * this.offset.x)}px`
    this.spacer.style.height = `${Math.floor(gh + 2 * this.offset.y)}px`
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.canvas.width = Math.round(width * dpr)
    this.canvas.height = Math.round(height * dpr)
    this.redraw()
  }

  private readColours(host: HTMLElement) {
    const style = getComputedStyle(host)
    const css = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
    this.colours = {
      surround: css('--ke-surround', this.colours.surround),
      accent: css('--ke-accent', this.colours.accent),
      shadow: css('--ke-shadow', this.colours.shadow),
      fabric: { ...LINEN, fabric: css('--ke-fabric', LINEN.fabric) },
    }
    this.redraw()
  }

  // ----- drawing -----

  private redraw() {
    if (!this.frame) this.frame = requestAnimationFrame(() => this.render())
  }

  private origin() {
    return { x: this.offset.x - this.scroller.scrollLeft, y: this.offset.y - this.scroller.scrollTop }
  }

  private render() {
    this.frame = 0
    const { ctx, pattern } = this
    const { width: vw, height: vh, dpr } = this.view
    const c = this.cell()
    const o = this.origin()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = this.colours.surround
    ctx.fillRect(0, 0, vw, vh)
    // The cells in view
    const x0 = Math.max(0, Math.floor(-o.x / c))
    const x1 = Math.min(pattern.width, Math.ceil((vw - o.x) / c))
    const y0 = Math.max(0, Math.floor(-o.y / c))
    const y1 = Math.min(pattern.height, Math.ceil((vh - o.y) / c))
    if (x1 <= x0 || y1 <= y0) return
    ctx.save()
    ctx.shadowColor = this.colours.shadow
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 4
    ctx.fillStyle = this.colours.fabric.fabric
    ctx.fillRect(o.x + x0 * c, o.y + y0 * c, (x1 - x0) * c, (y1 - y0) * c)
    ctx.restore()
    drawFabric(ctx, c, o.x, o.y, [x0, y0, x1, y1], this.colours.fabric)

    // While a selection is being moved, its stitches are drawn where they're going
    const moving = this.gesture?.type === 'move' ? this.gesture : null
    const visible: [Key, string][] = []
    for (const entry of pattern.stitches) {
      const { x, y } = parseKey(entry[0])
      if (x < x0 - 1 || x > x1 || y < y0 - 1 || y > y1) continue
      if (moving && inRegion(entry[0], moving.rect)) continue
      visible.push(entry)
    }
    drawStitches(ctx, visible, c, o.x, o.y)
    this.drawOverlays(c, o)
  }

  private dashedBox(r: Region, c: number, o: Point, fill?: string) {
    const { ctx } = this
    const X = o.x + r.x * c, Y = o.y + r.y * c, W = r.width * c, H = r.height * c
    if (fill) {
      ctx.fillStyle = fill
      ctx.fillRect(X, Y, W, H)
    }
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = this.colours.accent
    ctx.strokeRect(X - 1, Y - 1, W + 2, H + 2)
    ctx.setLineDash([])
  }

  private drawPiece(piece: Stitches, at: Point, c: number, o: Point, alpha: number, colour?: string) {
    this.ctx.globalAlpha = alpha
    const placed = [...translate(piece, at.x, at.y)].map(([k, own]) => [k, colour ?? own] as const)
    drawStitches(this.ctx, placed, c, o.x, o.y)
    this.ctx.globalAlpha = 1
  }

  private drawOverlays(c: number, o: Point) {
    const { ctx, gesture: g } = this
    const tint = 'rgb(163 64 28 / 0.07)'
    if (g?.type === 'move') {
      const at = { x: g.rect.x + g.dx, y: g.rect.y + g.dy }
      this.dashedBox({ ...g.rect, ...at }, c, o, tint)
      this.drawPiece(g.piece, at, c, o, 0.9)
      return
    }
    if (g?.type === 'select' && g.rect) return this.dashedBox(g.rect, c, o, tint)
    if (this.selection) this.dashedBox(this.selection, c, o, tint)
    if (this.tool === 'place' && this.placing) {
      const { motif, at, recolour } = this.placing
      this.dashedBox({ ...at, width: motif.width, height: motif.height }, c, o)
      this.drawPiece(motif.stitches, at, c, o, 0.55, recolour ? this.colour : undefined)
      return
    }
    const h = this.hover
    if (!h) return
    if (this.tool === 'pen') {
      const q = penStep(null, h.x, h.y, this.pattern.width, this.pattern.height)!
      ctx.strokeStyle = this.colour
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(o.x + q.x * c, o.y + q.y * c, Math.max(4, c * 0.22), 0, 2 * Math.PI)
      ctx.stroke()
    } else if (this.tool === 'shape') {
      const cell = cellAt(h.x, h.y)
      if (!this.inGrid(cell)) return
      ctx.fillStyle = tint
      ctx.fillRect(o.x + cell.x * c, o.y + cell.y * c, c, c)
      ctx.globalAlpha = 0.5
      drawStitches(ctx, SHAPES[this.shape](cell.x, cell.y).map((k) => [k, this.colour] as const), c, o.x, o.y)
      ctx.globalAlpha = 1
    } else if (this.tool === 'erase') {
      ctx.strokeStyle = this.colours.accent
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(o.x + h.x * c, o.y + h.y * c, this.eraseRadius() * c, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // ----- input -----

  private eraseRadius = () => Math.max(0.32, 8 / this.cell())

  // A position in the view (pixels from its top left) in cells
  private toGrid(x: number, y: number): Point {
    const c = this.cell()
    return { x: (x + this.scroller.scrollLeft - this.offset.x) / c, y: (y + this.scroller.scrollTop - this.offset.y) / c }
  }

  private eventPoint(e: { clientX: number; clientY: number }) {
    const r = this.scroller.getBoundingClientRect()
    return this.toGrid(e.clientX - r.left, e.clientY - r.top)
  }

  private inGrid = (cell: Point) => cell.x >= 0 && cell.y >= 0 && cell.x < this.pattern.width && cell.y < this.pattern.height

  private clampCell = (cell: Point) => ({
    x: Math.max(0, Math.min(this.pattern.width - 1, cell.x)),
    y: Math.max(0, Math.min(this.pattern.height - 1, cell.y)),
  })

  private stamp(cell: Point) {
    if (this.inGrid(cell)) for (const k of SHAPES[this.shape](cell.x, cell.y)) this.pattern.set(k, this.colour)
  }

  private eraseAt(p: Point) {
    for (const k of stitchesNear(p.x, p.y, this.eraseRadius())) this.pattern.set(k, undefined)
  }

  private placeAt(p: Point) {
    if (!this.placing) return
    const { motif } = this.placing
    this.placing.at = { x: Math.round(p.x - motif.width / 2), y: Math.round(p.y - motif.height / 2) }
  }

  private listen() {
    const s = this.scroller
    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions) => {
      s.addEventListener(type, fn as EventListener, options)
      this.cleanup.push(() => s.removeEventListener(type, fn as EventListener))
    }
    on('scroll', () => this.redraw(), { passive: true })
    on('pointerdown', (e) => this.pointerDown(e))
    on('pointermove', (e) => this.pointerMove(e))
    on('pointerup', (e) => this.pointerUp(e, false))
    on('pointercancel', (e) => this.pointerUp(e, true))
    on('pointerleave', (e) => {
      if (e.pointerType !== 'touch' && !this.gesture) {
        this.hover = null
        this.redraw()
      }
    })
    on('wheel', (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const r = s.getBoundingClientRect()
      this.setZoom(this.zoom * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025)), { x: e.clientX - r.left, y: e.clientY - r.top })
    }, { passive: false })
    on('contextmenu', (e) => e.preventDefault())
    const keyDown = (e: KeyboardEvent) => this.keyDown(e)
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && this.spaceHeld) {
        this.spaceHeld = false
        s.style.cursor = CURSORS[this.tool]
      }
    }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    this.cleanup.push(() => window.removeEventListener('keydown', keyDown), () => window.removeEventListener('keyup', keyUp))
  }

  private pointerDown(e: PointerEvent) {
    const s = this.scroller
    const r = s.getBoundingClientRect()
    // Clicks on the scrollbars scroll
    if (e.clientX - r.left > s.clientWidth || e.clientY - r.top > s.clientHeight) return
    s.focus({ preventScroll: true })
    if (e.pointerType === 'touch') {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.touches.size === 2) return this.startPinch()
      if (this.touches.size > 2) return
    }
    if (e.button !== 0 && e.button !== 1) return
    e.preventDefault()
    s.setPointerCapture(e.pointerId)
    const p = this.eventPoint(e)
    const { pattern } = this
    if (e.button === 1 || this.spaceHeld || this.tool === 'pan') {
      this.gesture = { type: 'pan', x: e.clientX, y: e.clientY, left: s.scrollLeft, top: s.scrollTop }
      return
    }
    switch (this.tool) {
      case 'pen':
        pattern.begin()
        this.gesture = { type: 'pen', last: penStep(null, p.x, p.y, pattern.width, pattern.height)!, start: p, added: 0 }
        break
      case 'shape': {
        const cell = cellAt(p.x, p.y)
        pattern.begin()
        this.gesture = { type: 'shape', last: cell }
        this.stamp(cell)
        break
      }
      case 'erase':
        pattern.begin()
        this.gesture = { type: 'erase', last: p }
        this.eraseAt(p)
        break
      case 'select': {
        const cell = cellAt(p.x, p.y)
        const sel = this.selection
        // Dragging inside the selection moves it; elsewhere starts a new one
        if (sel && cell.x >= sel.x && cell.y >= sel.y && cell.x < sel.x + sel.width && cell.y < sel.y + sel.height) {
          this.gesture = { type: 'move', start: cell, rect: sel, piece: extract(pattern.stitches, sel), dx: 0, dy: 0 }
        } else {
          this.gesture = { type: 'select', start: this.clampCell(cell), from: p, rect: null }
        }
        break
      }
      case 'place':
        this.placeAt(p)
        this.gesture = { type: 'place' }
        break
    }
    this.redraw()
  }

  private pointerMove(e: PointerEvent) {
    if (e.pointerType === 'touch' && this.touches.has(e.pointerId)) {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.gesture?.type === 'pinch') {
        if (this.touches.size >= 2) this.pinchMove()
        return
      }
    }
    const p = this.eventPoint(e)
    const g = this.gesture
    const { pattern } = this
    if (e.pointerType !== 'touch' || g) this.hover = p
    if (this.tool === 'place') this.placeAt(p)
    if (!g) return this.redraw()
    switch (g.type) {
      case 'pan':
        this.scroller.scrollLeft = g.left - (e.clientX - g.x)
        this.scroller.scrollTop = g.top - (e.clientY - g.y)
        return
      case 'pen': {
        const q = penStep(g.last, p.x, p.y, pattern.width, pattern.height)
        if (!q) break
        for (const k of stitchesAlong(g.last, q)) {
          pattern.set(k, this.colour)
          g.added++
        }
        g.last = q
        break
      }
      case 'shape': {
        const cell = cellAt(p.x, p.y)
        if (cell.x === g.last.x && cell.y === g.last.y) break
        for (const c of pointsBetween(g.last, cell).slice(1)) this.stamp(c)
        g.last = cell
        break
      }
      case 'erase': {
        // Erase along the way, so a fast stroke doesn't skip stitches
        const steps = Math.max(1, Math.ceil(Math.hypot(p.x - g.last.x, p.y - g.last.y) / 0.2))
        for (let i = 1; i <= steps; i++) {
          this.eraseAt({ x: g.last.x + ((p.x - g.last.x) * i) / steps, y: g.last.y + ((p.y - g.last.y) * i) / steps })
        }
        g.last = p
        break
      }
      case 'select':
        if (g.rect || Math.hypot(p.x - g.from.x, p.y - g.from.y) > 0.25) {
          g.rect = regionBetween(g.start, this.clampCell(cellAt(p.x, p.y)))
        }
        break
      case 'move': {
        const cell = cellAt(p.x, p.y)
        g.dx = Math.max(-g.rect.x, Math.min(pattern.width - g.rect.x - g.rect.width, cell.x - g.start.x))
        g.dy = Math.max(-g.rect.y, Math.min(pattern.height - g.rect.y - g.rect.height, cell.y - g.start.y))
        break
      }
    }
    this.redraw()
  }

  private pointerUp(e: PointerEvent, cancelled: boolean) {
    if (e.pointerType === 'touch') {
      this.touches.delete(e.pointerId)
      if (this.gesture?.type === 'pinch') {
        if (this.touches.size === 0) this.gesture = null
        return
      }
    }
    const g = this.gesture
    this.gesture = null
    if (!g) return
    const { pattern } = this
    if (cancelled && (g.type === 'pen' || g.type === 'shape' || g.type === 'erase')) {
      pattern.cancel()
      return this.redraw()
    }
    switch (g.type) {
      case 'pen': {
        // A tap without moving adds or removes the stitch under the pointer
        const p = this.eventPoint(e)
        if (g.added === 0 && Math.hypot(p.x - g.start.x, p.y - g.start.y) < 0.3) {
          const near = stitchesNear(p.x, p.y, 0.5)[0]
          if (near) pattern.set(near, pattern.stitches.get(near) === this.colour ? undefined : this.colour)
        }
        pattern.end()
        break
      }
      case 'shape':
      case 'erase':
        pattern.end()
        break
      case 'select':
        this.select(g.rect)
        break
      case 'move':
        if (g.dx || g.dy) rework(pattern, g.rect, undefined, g.dx, g.dy)
        this.select({ ...g.rect, x: g.rect.x + g.dx, y: g.rect.y + g.dy })
        break
      case 'place': {
        const placing = this.placing
        if (!placing) break
        placeMotif(pattern, placing.motif, placing.at.x, placing.at.y, placing.recolour ? this.colour : undefined)
        // A pasted piece is placed once and selected; a template can be placed again
        if (placing.kind === 'paste') {
          this.setTool('select')
          this.select({ ...placing.at, width: placing.motif.width, height: placing.motif.height })
        }
        break
      }
    }
    if (e.pointerType === 'touch') this.hover = null
    this.redraw()
  }

  private startPinch() {
    if (this.gesture && this.gesture.type !== 'pan') this.pattern.cancel()
    const [a, b] = [...this.touches.values()]
    const r = this.scroller.getBoundingClientRect()
    const g = this.toGrid((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top)
    this.gesture = { type: 'pinch', distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: this.zoom, gx: g.x, gy: g.y }
    this.hover = null
    this.redraw()
  }

  // Two fingers zoom around the point between them, and moving them pans
  private pinchMove() {
    const g = this.gesture
    if (g?.type !== 'pinch') return
    const [a, b] = [...this.touches.values()]
    const r = this.scroller.getBoundingClientRect()
    const mx = (a.x + b.x) / 2 - r.left
    const my = (a.y + b.y) / 2 - r.top
    this.zoom = Math.max(MIN_CELL / BASE_CELL, Math.min(MAX_CELL / BASE_CELL, (g.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / g.distance))
    this.layout()
    this.scroller.scrollLeft = g.gx * this.cell() + this.offset.x - mx
    this.scroller.scrollTop = g.gy * this.cell() + this.offset.y - my
    this.changed()
  }

  private keyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
    const mod = e.ctrlKey || e.metaKey
    const k = e.key.toLowerCase()
    const tools: Record<string, Tool> = { p: 'pen', s: 'shape', e: 'erase', v: 'select', h: 'pan' }
    if (mod && k === 'z') e.shiftKey ? this.redo() : this.undo()
    else if (mod && k === 'y') this.redo()
    else if (mod && k === 'c' && this.selection) {
      this.copySelection()
      this.notify('copied')
    } else if (mod && k === 'x' && this.selection) this.cutSelection()
    else if (mod && k === 'v' && this.clipboard) this.paste()
    else if (mod && k === 'a') this.selectAll()
    else if (k === 'escape') this.tool === 'place' ? this.stopPlacing() : this.select(null)
    else if ((k === 'delete' || k === 'backspace') && this.selection) this.deleteSelection()
    else if (k === 'r' && !mod && this.tool === 'place') this.rotatePlacing()
    else if (k === ' ' && e.target === this.scroller) {
      if (e.repeat) return e.preventDefault()
      this.spaceHeld = true
      this.scroller.style.cursor = 'grab'
    } else if ((k === '+' || k === '=') && !mod) this.zoomIn()
    else if (k === '-' && !mod) this.zoomOut()
    else if (k.startsWith('arrow') && this.selection) {
      this.nudgeSelection(k === 'arrowleft' ? -1 : k === 'arrowright' ? 1 : 0, k === 'arrowup' ? -1 : k === 'arrowdown' ? 1 : 0)
    } else if (!mod && !e.altKey && tools[k]) this.setTool(tools[k])
    else return
    e.preventDefault()
  }
}
