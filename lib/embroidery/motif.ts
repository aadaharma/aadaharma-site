// Templates (motifs): a piece of pattern with its corner at (0,0), saved as JSON in the
// database and placed onto a pattern by the user.
import type { Pattern } from './pattern'
import { bounds, translate } from './regions'
import { inGrid, type Key, type Stitches } from './stitches'

export type Motif = { width: number; height: number; stitches: Stitches }

// As stored: stitch keys grouped by colour, e.g. { "#bd0603": ["h:0,0", "d:1,0"] }
export type MotifJson = { width: number; height: number; stitches: Record<string, Key[]> }

// The largest grids: a pattern in the designer, and a template drawn in the admin
// (tall enough for a drawing that runs down a whole page)
export type Size = { width: number; height: number }
export const DESIGN_MAX: Size = { width: 200, height: 200 }
export const TEMPLATE_MAX: Size = { width: 200, height: 400 }

const KEY = /^[hvda]:\d+,\d+$/
const COLOUR = /^#[0-9a-f]{6}$/i

export function motifToJson({ width, height, stitches }: Motif): MotifJson {
  const byColour: Record<string, Key[]> = {}
  for (const [k, colour] of stitches) (byColour[colour] ??= []).push(k)
  return { width, height, stitches: byColour }
}

// Reads a motif from JSON (e.g. from the admin's request), or null if it isn't valid
export function motifFromJson(json: unknown, max: Size = DESIGN_MAX): Motif | null {
  if (!json || typeof json !== 'object') return null
  const { width, height, stitches } = json as Partial<MotifJson>
  if (!Number.isInteger(width) || !Number.isInteger(height) || width! < 1 || height! < 1) return null
  if (width! > max.width || height! > max.height || !stitches || typeof stitches !== 'object') return null
  const out: Stitches = new Map()
  for (const [colour, keys] of Object.entries(stitches)) {
    if (!COLOUR.test(colour) || !Array.isArray(keys)) return null
    for (const k of keys) {
      if (typeof k !== 'string' || !KEY.test(k) || !inGrid(k as Key, width!, height!)) return null
      out.set(k as Key, colour.toLowerCase())
    }
  }
  return { width: width!, height: height!, stitches: out }
}

// A motif trimmed to its stitches, e.g. from a selection with empty space around it
export function motifFrom(stitches: Stitches): Motif | null {
  const b = bounds(stitches)
  if (!b) return null
  return { width: b.width, height: b.height, stitches: translate(stitches, -b.x, -b.y) }
}

// Places a motif with its corner at cell (x, y) as one undo step. With a colour, the
// whole motif is stitched in it; otherwise it keeps its own colours.
export function placeMotif(pattern: Pattern, motif: Motif, x: number, y: number, colour?: string) {
  pattern.edit(() => {
    for (const [k, c] of translate(motif.stitches, x, y)) pattern.set(k, colour ?? c)
  })
}

// One-colour motifs are stitched in the user's colour; others keep their own colours
export const isOneColour = (motif: Motif) => new Set(motif.stitches.values()).size <= 1
