// The home page's creatures: Aada's embroidered birds and fox (from her elämänpuu template,
// see scripts/home-creatures.ts), each standing on one of the hills of her collage
// (public/img/home/) and leading to a part of the site.
import type { Key } from '../embroidery/stitches'
import data from './creatures.json'

export type Point = [number, number]
export const CREATURE_KEYS = ['embroidery', 'knitting', 'patterns', 'about', 'cv'] as const
export type CreatureKey = (typeof CREATURE_KEYS)[number]
// Its stitches, the stitches of what hangs from its beak, and where that hangs from
export type Creature = { body: Key[]; item: Key[]; hang: Point | null }
export type Creatures = Record<CreatureKey, Creature>

export const CREATURES = data as Creatures

// The collage, in layers from back to front. Each is cut out of Aada's 1920 × 1080 picture:
// `at` is where it sat there (its top left corner), `phone` where it goes when the hills are
// stacked up a tall phone screen, 880 pixels wide; the hills behind are each hidden at
// their foot (where Aada's picture cut them off) by the ones in front. Each hill has a creature on top: `spot`
// is where it stands, in the layer's own pixels.
export const SCENE = { width: 1920, height: 1080 }
export const PHONE = { width: 880, height: 1420 }
export const SKY = '/img/home/sky.webp'

export type Layer = {
  name: string
  src: string
  size: Point
  at: Point
  phone: Point
  // A different width on the phone
  phoneWidth?: number
  creature?: CreatureKey
  spot?: Point
}

export const LAYERS: Layer[] = [
  { name: 'hello', size: [1253, 248], at: [584, 77], phone: [40, 50], phoneWidth: 800 },
  // brown knitting
  { name: 'brown', size: [394, 594], at: [0, 427], phone: [0, 340], creature: 'cv', spot: [150, 7] },
  // green cables
  { name: 'cables', size: [874, 527], at: [618, 553], phone: [-30, 610], creature: 'embroidery', spot: [462, 7] },
  // the book page, bigger on the phone so its bird stands well above the two in front
  { name: 'book', size: [848, 387], at: [0, 693], phone: [0, 917], phoneWidth: 1102, creature: 'patterns', spot: [510, 14] },
  // the mossy rock, a little down its right slope
  { name: 'rock', size: [497, 258], at: [532, 822], phone: [0, 1162], creature: 'about', spot: [340, 30] },
  // yellow knitting
  { name: 'yellow', size: [651, 301], at: [1269, 779], phone: [229, 1119], creature: 'knitting', spot: [421, 5] },
].map((l) => ({ ...l, src: `/img/home/${l.name}.webp` }) as Layer)

// One stitch in the picture's pixels
export const CELL = 18

// How some of them sit: the fox lies on its belly (the bottom row of its body, not its tail
// tip), tilted down the rock's slope so its tail hangs lower; the small bird is upside down,
// resting on its back
export const POSE: Partial<Record<CreatureKey, { belly?: number; rotate?: number; flip?: boolean }>> = {
  about: { belly: 38, rotate: 14 },
  cv: { flip: true },
}

// White thread with red things in their beaks, bright against the sky
export const THREAD = { creature: '#ffffff', item: '#bd0603' }
