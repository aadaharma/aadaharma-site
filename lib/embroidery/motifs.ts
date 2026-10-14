// The designer's first templates, until templates are kept in the database and drawn
// in the admin. Each is in one colour and is stitched in the colour the user has chosen.
import { motifFromJson, type Motif } from './motif'
import type { Key } from './stitches'

export const DEFAULT_COLOUR = '#bd0603'

export const CATEGORIES = [
  { id: 'stars', en: 'Stars', fi: 'Tähdet' },
  { id: 'rhombuses', en: 'Rhombuses', fi: 'Vinoneliöt' },
  { id: 'birds', en: 'Birds', fi: 'Linnut' },
  { id: 'trees', en: 'Trees', fi: 'Puut' },
  { id: 'borders', en: 'Borders', fi: 'Reunukset' },
] as const

export type Category = (typeof CATEGORIES)[number]['id']
export type Template = { id: string; name: { en: string; fi: string }; category: Category; motif: Motif }

const template = (id: string, en: string, fi: string, category: Category, width: number, height: number, keys: string) => ({
  id,
  name: { en, fi },
  category,
  motif: motifFromJson({ width, height, stitches: { [DEFAULT_COLOUR]: keys.split(' ') as Key[] } })!,
})

export const TEMPLATES: Template[] = [
  template('star8', 'Eight-pointed star', 'Kahdeksankanta', 'stars', 12, 12,
    'a:0,5 a:1,4 a:10,7 a:11,6 a:2,3 a:3,2 a:4,1 a:4,5 a:4,7 a:5,0 a:5,4 a:5,6 a:6,11 a:6,5 a:6,7 ' +
    'a:7,10 a:7,4 a:7,6 a:8,9 a:9,8 d:0,6 d:1,7 d:10,4 d:11,5 d:2,8 d:3,9 d:4,10 d:4,4 d:4,6 ' +
    'd:5,11 d:5,5 d:5,7 d:6,0 d:6,4 d:6,6 d:7,1 d:7,5 d:7,7 d:8,2 d:9,3 h:0,6 h:1,6 h:10,6 h:11,6 ' +
    'h:2,10 h:2,2 h:3,10 h:3,2 h:4,10 h:4,2 h:5,10 h:5,2 h:6,10 h:6,2 h:7,10 h:7,2 h:8,10 h:8,2 ' +
    'h:9,10 h:9,2 v:10,2 v:10,3 v:10,4 v:10,5 v:10,6 v:10,7 v:10,8 v:10,9 v:2,2 v:2,3 v:2,4 v:2,5 ' +
    'v:2,6 v:2,7 v:2,8 v:2,9 v:6,0 v:6,1 v:6,10 v:6,11'),
  template('rosette', 'Rosette star', 'Ruusuketähti', 'stars', 12, 12,
    'a:2,5 a:3,8 a:4,7 a:5,2 a:5,6 a:5,7 a:6,5 a:6,9 a:7,4 a:7,5 a:8,3 a:9,6 d:2,6 d:3,3 d:4,4 ' +
    'd:4,5 d:5,4 d:5,5 d:5,9 d:6,2 d:6,6 d:7,7 d:8,8 d:9,5 h:0,6 h:1,6 h:10,6 h:11,6 h:2,10 h:2,2 ' +
    'h:2,3 h:2,9 h:3,5 h:3,7 h:4,7 h:5,6 h:6,6 h:7,7 h:8,5 h:8,7 h:9,10 h:9,2 h:9,3 h:9,9 v:10,2 ' +
    'v:10,9 v:2,2 v:2,9 v:3,2 v:3,9 v:5,3 v:5,8 v:6,0 v:6,1 v:6,10 v:6,11 v:6,5 v:6,6 v:7,3 v:7,4 ' +
    'v:7,7 v:7,8 v:9,2 v:9,9'),
  template('rhombus', 'Nested rhombus', 'Sisäkkäiset vinoneliöt', 'rhombuses', 10, 10,
    'a:0,4 a:1,3 a:2,2 a:2,4 a:3,1 a:3,3 a:4,0 a:4,2 a:4,4 a:5,5 a:5,7 a:5,9 a:6,6 a:6,8 a:7,5 ' +
    'a:7,7 a:8,6 a:9,5 d:0,5 d:1,6 d:2,5 d:2,7 d:3,6 d:3,8 d:4,5 d:4,7 d:4,9 d:5,0 d:5,2 d:5,4 ' +
    'd:6,1 d:6,3 d:7,2 d:7,4 d:8,3 d:9,4 h:0,5 h:1,5 h:8,5 h:9,5 v:5,0 v:5,1 v:5,8 v:5,9'),
  template('hooked', 'Hooked rhombus', 'Koukkuvinoneliö', 'rhombuses', 12, 12,
    'a:0,4 a:11,7 a:2,5 a:3,4 a:4,3 a:4,5 a:5,11 a:5,2 a:5,4 a:5,6 a:6,0 a:6,5 a:6,7 a:6,9 a:7,6 ' +
    'a:7,8 a:8,7 a:9,6 d:0,5 d:11,6 d:2,6 d:3,7 d:4,11 d:4,6 d:4,8 d:5,5 d:5,7 d:5,9 d:6,2 d:6,4 ' +
    'd:6,6 d:7,0 d:7,3 d:7,5 d:8,4 d:9,5 h:1,6 h:10,6 v:6,1 v:6,10'),
  template('bird', 'Bird', 'Lintu', 'birds', 14, 11,
    'a:10,1 a:10,5 a:11,2 a:5,3 a:5,9 a:6,2 a:7,5 a:8,4 a:9,6 d:1,2 d:1,4 d:10,2 d:11,1 d:2,3 ' +
    'd:3,5 d:4,6 d:5,4 d:6,5 d:6,9 d:7,2 d:8,3 d:8,9 h:10,4 h:12,2 h:2,5 h:3,4 h:4,4 h:5,7 h:6,7 ' +
    'h:7,7 h:8,7 h:9,4 v:1,2 v:1,3 v:11,3 v:11,4 v:6,7 v:6,8 v:7,2 v:7,3 v:7,4 v:7,5 v:8,7 v:8,8'),
  template('tree', 'Tree of life', 'Elämänpuu', 'trees', 12, 13,
    'a:10,5 a:5,0 a:5,12 a:6,1 a:6,3 a:6,6 a:6,9 a:7,2 a:7,5 a:7,8 a:8,4 a:8,7 a:9,6 d:1,5 d:2,6 ' +
    'd:3,4 d:3,7 d:4,2 d:4,5 d:4,8 d:5,1 d:5,3 d:5,6 d:5,9 d:6,0 d:6,12 h:3,13 h:4,13 h:5,13 ' +
    'h:6,13 h:7,13 h:8,13 v:6,10 v:6,11 v:6,2 v:6,3 v:6,4 v:6,5 v:6,6 v:6,7 v:6,8 v:6,9'),
  template('spruce', 'Spruce', 'Kuusi', 'trees', 8, 10,
    'a:0,5 a:1,2 a:1,4 a:2,1 a:2,3 a:3,0 d:4,0 d:5,1 d:5,3 d:6,2 d:6,4 d:7,5 h:0,6 h:1,3 h:1,6 ' +
    'h:2,3 h:2,6 h:2,9 h:3,8 h:3,9 h:4,8 h:4,9 h:5,3 h:5,6 h:5,9 h:6,3 h:6,6 h:7,6 v:3,6 v:3,7 ' +
    'v:4,2 v:4,3 v:4,4 v:4,5 v:4,6 v:5,6 v:5,7'),
  template('border-diamond', 'Diamond border', 'Vinoneliöreunus', 'borders', 8, 6,
    'a:0,2 a:1,1 a:2,4 a:3,3 a:4,2 a:5,1 a:6,4 a:7,3 d:0,3 d:1,4 d:2,1 d:3,2 d:4,3 d:5,4 d:6,1 ' +
    'd:7,2 h:0,0 h:0,6 h:1,0 h:1,6 h:2,0 h:2,6 h:3,0 h:3,6 h:4,0 h:4,6 h:5,0 h:5,6 h:6,0 h:6,6 ' +
    'h:7,0 h:7,6 v:2,2 v:2,3 v:6,2 v:6,3'),
  template('border-spruce', 'Spruce border', 'Kuusireunus', 'borders', 8, 5,
    'a:0,3 a:1,2 a:1,3 a:4,3 a:5,2 a:5,3 d:2,2 d:2,3 d:3,3 d:6,2 d:6,3 d:7,3 h:0,5 h:1,5 h:2,5 ' +
    'h:3,5 h:4,5 h:5,5 h:6,5 h:7,5 v:2,0 v:2,1 v:4,0 v:6,0 v:6,1'),
  template('border-wave', 'Running wave', 'Aaltoreunus', 'borders', 8, 4,
    'a:0,2 a:1,1 a:6,2 a:7,1 d:3,1 d:4,2 h:0,0 h:0,4 h:1,0 h:1,4 h:2,0 h:2,1 h:2,4 h:3,0 h:3,4 ' +
    'h:4,0 h:4,4 h:5,0 h:5,3 h:5,4 h:6,0 h:6,4 h:7,0 h:7,4'),
]
