// Line icons for the designer, 20 × 20, drawn with the current text colour
import type { ReactNode } from 'react'

const PATHS = {
  pen: <><path d="M4 16L8 12L12 12L16 8M16 8L13 5M16 8L19 11" /><circle cx="4" cy="16" r="1.6" fill="currentColor" /></>,
  shape: <><rect x="5" y="5" width="10" height="10" /><path d="M5 5L15 15M15 5L5 15" strokeOpacity=".55" /></>,
  erase: <><path d="M8 17L3 12L11 4L17 10L10 17H17" /></>,
  select: <><path d="M3 3h4M10 3h3M16 3v4M16 10v3M16 16h-4M9 16H6M3 16v-3M3 10V6" /></>,
  pan: <><path d="M10 2v16M2 10h16M10 2l-2.5 2.5M10 2l2.5 2.5M10 18l-2.5-2.5M10 18l2.5-2.5M2 10l2.5-2.5M2 10l2.5 2.5M18 10l-2.5-2.5M18 10l-2.5 2.5" /></>,
  undo: <><path d="M7 5L3 9L7 13M3 9H12A5 5 0 0 1 12 19H8" /></>,
  redo: <><path d="M13 5L17 9L13 13M17 9H8A5 5 0 0 0 8 19H12" /></>,
  zoomIn: <><circle cx="8.5" cy="8.5" r="5.5" /><path d="M13 13L18 18M6 8.5H11M8.5 6V11" /></>,
  zoomOut: <><circle cx="8.5" cy="8.5" r="5.5" /><path d="M13 13L18 18M6 8.5H11" /></>,
  fit: <><path d="M3 7V3H7M13 3H17V7M17 13V17H13M7 17H3V13" /></>,
  download: <><path d="M10 3V13M6 9L10 13L14 9M4 17H16" /></>,
  clear: <><path d="M4 6H16M8 6V4H12V6M6 6L7 17H13L14 6" /></>,
  mirrorH: <><path d="M10 2V18" strokeDasharray="2 2" /><path d="M7 5L3 10L7 15ZM13 5L17 10L13 15Z" /></>,
  mirrorV: <><path d="M2 10H18" strokeDasharray="2 2" /><path d="M5 7L10 3L15 7ZM5 13L10 17L15 13Z" /></>,
  rotate: <><path d="M15 4V8H11" /><path d="M15 8A6 6 0 1 0 16 13" /></>,
  copy: <><rect x="7" y="7" width="10" height="10" rx="1" /><path d="M13 7V4H3V14H7" /></>,
  paste: <><rect x="5" y="4" width="10" height="14" rx="1" /><path d="M8 4V2H12V4M8 9H12M8 12H12" /></>,
  trash: <><path d="M4 6H16M8 6V4H12V6M6 6L7 17H13L14 6" /></>,
  recolour: <><path d="M10 3C10 3 5 9 5 12A5 5 0 0 0 15 12C15 9 10 3 10 3Z" /></>,
  close: <><path d="M5 5L15 15M15 5L5 15" /></>,
  check: <><path d="M4 10L8 14L16 6" /></>,
  menu: <><path d="M3 6H17M3 10H17M3 14H17" /></>,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

// The cell shapes as small pictures: a dashed cell with the shape's stitches
const SHAPE_PATHS = {
  square: 'M4 4H16V16H4Z',
  cross: 'M4 4L16 16M16 4L4 16',
  'diag-left': 'M4 4L16 16',
  'diag-right': 'M16 4L4 16',
  'line-left': 'M4 4V16',
  'line-right': 'M16 4V16',
  'line-top': 'M4 4H16',
  'line-bottom': 'M4 16H16',
}

export function ShapeIcon({ shape, size = 24 }: { shape: keyof typeof SHAPE_PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="12" height="12" fill="none" stroke="currentColor" strokeOpacity=".28" strokeDasharray="2 2" />
      <path d={SHAPE_PATHS[shape]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
