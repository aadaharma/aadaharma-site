// The home page's creatures: Aada's embroidered birds and fox (from her elämänpuu template,
// see scripts/home-creatures.ts), each standing on a hill of public/img/hills.webp and
// leading to a part of the site.
import type { Key } from '../embroidery/stitches'
import data from './creatures.json'

export type Point = [number, number]
export const CREATURE_KEYS = ['embroidery', 'knitting', 'patterns', 'about', 'cv'] as const
export type CreatureKey = (typeof CREATURE_KEYS)[number]
// Its stitches, the stitches of what hangs from its beak, and where that hangs from
export type Creature = { body: Key[]; item: Key[]; hang: Point | null }
export type Creatures = Record<CreatureKey, Creature>

export const CREATURES = data as Creatures

// The picture the creatures stand on, and its size
export const SCENE = { src: '/img/hills.webp', width: 1920, height: 1080 }
// One stitch in the picture's pixels
export const CELL = 18

// Where each one stands: the top of its hill in the picture
export const HILLS: Record<CreatureKey, Point> = {
  cv: [150, 434], // brown knitting
  patterns: [510, 707], // the book page
  about: [872, 852], // the mossy rock, a little down its right slope
  embroidery: [1080, 560], // green cables
  knitting: [1690, 784], // yellow knitting
}

// How some of them sit: the fox lies on its belly (the bottom row of its body, not its tail
// tip), tilted down the rock's slope so its tail hangs lower; the small bird is upside down,
// resting on its back
export const POSE: Partial<Record<CreatureKey, { belly?: number; rotate?: number; flip?: boolean }>> = {
  about: { belly: 38, rotate: 14 },
  cv: { flip: true },
}

// White thread with red things in their beaks, bright against the sky
export const THREAD = { creature: '#ffffff', item: '#bd0603' }
