// The stitch shapes that are placed one cell at a time (the original designer's tools)
import { key, type Key } from './stitches'

export const SHAPES = {
  square: (x: number, y: number) => [key('h', x, y), key('h', x, y + 1), key('v', x, y), key('v', x + 1, y)],
  cross: (x: number, y: number) => [key('d', x, y), key('a', x, y)],
  'diag-left': (x: number, y: number) => [key('d', x, y)], // \
  'diag-right': (x: number, y: number) => [key('a', x, y)], // /
  'line-left': (x: number, y: number) => [key('v', x, y)],
  'line-right': (x: number, y: number) => [key('v', x + 1, y)],
  'line-top': (x: number, y: number) => [key('h', x, y)],
  'line-bottom': (x: number, y: number) => [key('h', x, y + 1)],
} satisfies Record<string, (x: number, y: number) => Key[]>

export type Shape = keyof typeof SHAPES
export const isShape = (value: string): value is Shape => value in SHAPES
