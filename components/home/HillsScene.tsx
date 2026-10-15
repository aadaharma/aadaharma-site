'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { CELL, CREATURES, LAYERS, PHONE, POSE, SCENE, SKY, THREAD, type CreatureKey, type Layer } from '@/lib/home/creatures'
import { endpoints, type Key } from '@/lib/embroidery/stitches'
import { TagPicture } from './TagPicture'

// The home page: Aada's collage of hills under the sky, with an embroidered creature on
// each hilltop. The collage is in layers, so on a phone held upright the hills can stack up
// the screen instead of standing side by side. Each creature is a link; pointing at it, focusing it or tapping it once
// makes it hop, swings what it holds and hangs a little tag saying where it leads.

// Every stitch is the same stitch of real thread, cut from a photo of Aada's bookmark
// (public/img/stitch.png): 54 px of thread plus 6 px at each end that fade out, so
// neighbouring stitches overlap and corners join. It's grey, and dyed by a filter.
const STITCH = { src: '/img/stitch.png', h: 25, len: 54, end: 6 }
const PX = CELL / STITCH.len
const THICK = STITCH.h * PX
const END = STITCH.end * PX
const ANGLE = { h: 0, v: 90, d: 45, a: 135 }
const r1 = (n: number) => Math.round(n * 10) / 10

export type SceneLink = { href: string; download?: boolean } | null
type Props = {
  label: string
  words: Record<CreatureKey, string>
  links: Record<CreatureKey, SceneLink>
}

function box(keys: Key[]) {
  const pts = keys.flatMap((k) => endpoints(k))
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
  return { pts, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}

// Dyed by a filter: either named here, or (for a creature's body) by its layer through CSS,
// since each creature's colour depends on the layout
function Stitches({ keys, dye, className }: { keys: Key[]; dye?: string; className?: string }) {
  return (
    <g filter={dye && `url(#dye-${dye})`} className={className}>
      {keys.map((k) => {
        // From the stitch's first end (a / stitch starts at its top right corner)
        const [{ x, y }] = endpoints(k)
        const kind = k[0] as keyof typeof ANGLE
        return (
          <use
            key={k}
            href={kind === 'd' || kind === 'a' ? '#stitch-d' : '#stitch-s'}
            transform={`translate(${x * CELL} ${y * CELL}) rotate(${ANGLE[kind]})`}
          />
        )
      })}
    </g>
  )
}

// One creature, drawn with its resting point at (0, 0)
function Creature({ name }: { name: CreatureKey }) {
  const { body, item, hang } = CREATURES[name]
  const pose = POSE[name] ?? {}
  const b = box(body)
  // What rests on the hill: the middle of its lowest row of stitches (the fox's belly row,
  // the upside-down bird's top)
  const restY = pose.flip ? b.y0 : (pose.belly ?? b.y1)
  const row = b.pts.filter((p) => p.y === restY).map((p) => p.x)
  const foot = [(Math.min(...row) + Math.max(...row)) / 2, restY]
  const turn = `${pose.rotate ? `rotate(${pose.rotate}) ` : ''}${pose.flip ? 'scale(1 -1) ' : ''}`

  let held: ReactNode = null
  if (item.length && hang) {
    // It swings from where its thread meets the creature, given as a share of its own box
    const ib = box(item)
    const ox = ((hang[0] - ib.x0) / Math.max(ib.x1 - ib.x0, 1)) * 100
    const oy = ((hang[1] - ib.y0) / Math.max(ib.y1 - ib.y0, 1)) * 100
    held = (
      <g className="creature__item" style={{ transformOrigin: `${r1(ox)}% ${r1(oy)}%` }}>
        <Stitches keys={item} dye="item" />
      </g>
    )
    // A tilted creature's item still hangs straight down
    if (pose.rotate) held = <g transform={`rotate(${-pose.rotate} ${hang[0] * CELL} ${hang[1] * CELL})`}>{held}</g>
  }

  // The halo round it and what it holds is also what you tap
  const all = box([...body, ...item])
  const [x0, x1, y0, y1] = [all.x0, all.x1, all.y0, all.y1].map((n) => n * CELL)
  return (
    <g transform={`${turn}translate(${r1(-foot[0] * CELL)} ${r1(-foot[1] * CELL)})`}>
      <ellipse
        className="creature__halo"
        cx={r1((x0 + x1) / 2)}
        cy={r1((y0 + y1) / 2)}
        rx={r1((x1 - x0) * 0.62 + 14)}
        ry={r1((y1 - y0) * 0.62 + 14)}
      />
      <g className="creature__bob">
        <Stitches keys={body} className="creature__thread" />
        {held}
      </g>
    </g>
  )
}

// A colour as a filter that dyes the grey thread. Near-white thread gets its shadows lifted,
// so it stays bright and still shows its twist.
function Dye({ id, colour }: { id: string; colour: string }) {
  const rgb = [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16) / 255)
  const lift = Math.min(...rgb) > 0.9 ? 0.35 : 0
  const [r, g, b] = rgb.map((v) => (v * (1 - lift)).toFixed(3))
  return (
    <filter id={`dye-${id}`} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={`${r} 0 0 0 ${lift}  0 ${g} 0 0 ${lift}  0 0 ${b} 0 ${lift}  0 0 0 1 0`} />
    </filter>
  )
}

export function HillsScene({ label, words, links }: Props) {
  const stage = useRef<HTMLDivElement>(null)
  const tag = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<CreatureKey | null>(null)
  // What the tag last showed, so it keeps its words while it fades away
  const [last, setLast] = useState<CreatureKey | null>(null)
  // A tap first shows where a creature leads; the second tap goes there. A tap also focuses
  // the link before its click (which shows the tag), so remember what was showing when the
  // finger went down.
  const touch = useRef(false)
  const wasShown = useRef(false)

  // Hang the tag above the creature if there's room; else beside it, away from the middle if
  // the window has room there; else below it
  const place = useCallback(() => {
    const t = tag.current, s = stage.current
    const halo = active && s?.querySelector(`[data-creature="${active}"] .creature__halo`)
    if (!t || !s || !halo) return
    const b = halo.getBoundingClientRect()
    const sr = s.getBoundingClientRect()
    const half = Math.max(t.offsetWidth / 2, 60)
    const x = Math.min(Math.max(b.left + b.width / 2 - sr.left, half + 8), sr.width - half - 8)
    const roomAbove = b.top - sr.top >= t.offsetHeight + 16
    const roomLeft = b.left - t.offsetWidth - 24 > 0
    const roomRight = b.right + t.offsetWidth + 24 < document.documentElement.clientWidth
    const outward = b.left + b.width / 2 < sr.left + sr.width / 2 ? 'left' : 'right'
    const side = !roomAbove && (roomLeft || roomRight)
    const left = side && (outward === 'left' ? roomLeft : !roomRight)
    const below = !roomAbove && !side
    t.dataset.place = side ? (left ? 'left' : 'right') : below ? 'below' : 'above'
    t.style.left = `${side ? (left ? b.left : b.right) - sr.left : x}px`
    t.style.top = `${side ? b.top - sr.top + b.height / 2 : below ? b.bottom - sr.top - 8 : b.top - sr.top + 8}px`
  }, [active])

  useLayoutEffect(place, [place])
  useEffect(() => {
    addEventListener('resize', place)
    const keys = () => (touch.current = false)
    addEventListener('keydown', keys)
    // Tapping anywhere else puts the tag away
    const away = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.('.creature')) setActive(null)
    }
    document.addEventListener('pointerdown', away)
    return () => {
      removeEventListener('resize', place)
      removeEventListener('keydown', keys)
      document.removeEventListener('pointerdown', away)
    }
  }, [place])

  const creature = (name: CreatureKey) => {
    const link = links[name]
    // Without a link (the CV before there's a PDF) it's just a bird on a hill
    if (!link) return <Creature name={name} />
    const show = () => {
      setActive(name)
      setLast(name)
    }
    const hide = () => setActive((a) => (a === name ? null : a))
    return (
      <a
        className={`creature${active === name ? ' is-active' : ''}`}
        data-creature={name}
        href={link.href}
        download={link.download || undefined}
        aria-label={words[name]}
        onPointerDown={(e) => {
          touch.current = e.pointerType !== 'mouse'
          wasShown.current = active === name
        }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          if (touch.current && !wasShown.current) {
            e.preventDefault()
            show()
            wasShown.current = true
          }
        }}
      >
        <Creature name={name} />
      </a>
    )
  }

  // Where a layer goes, as shares of the whole picture, wide and on a phone
  const layerStyle = (l: Layer) => {
    const [w, h] = l.size
    const pw = l.phoneWidth ?? w
    const pct = (n: number, of: number) => `${r1((n / of) * 1e4) / 100}%`
    return {
      '--x': pct(l.at[0], SCENE.width),
      '--y': pct(l.at[1], SCENE.height),
      '--w': pct(w, SCENE.width),
      '--px': pct(l.phone[0], PHONE.width),
      '--py': pct(l.phone[1], PHONE.height),
      '--pw': pct(pw, PHONE.width),
      // so a creature on a layer drawn bigger isn't bigger too
      '--grown': r1((w / pw) * 1000) / 1000,
      ...(l.creature && {
        '--dye-wide': `url(#dye-${l.creature}-wide)`,
        '--dye-phone': `url(#dye-${l.creature}-phone)`,
      }),
      aspectRatio: `${w} / ${h}`,
    } as CSSProperties
  }

  return (
    <div
      className="hills"
      ref={stage}
      role="group"
      aria-label={label}
      style={{ '--wide': `${SCENE.width} / ${SCENE.height}`, '--tall': `${PHONE.width} / ${PHONE.height}` } as CSSProperties}
    >
      <svg className="hills__defs" aria-hidden="true">
        <defs>
          {[['s', CELL], ['d', CELL * Math.SQRT2]].map(([id, len]) => (
            <image
              key={id}
              id={`stitch-${id}`}
              href={STITCH.src}
              x={r1(-END)}
              y={r1(-THICK / 2)}
              width={r1(+len + 2 * END)}
              height={r1(THICK)}
              preserveAspectRatio="none"
            />
          ))}
          {Object.entries(THREAD.creature).flatMap(([name, { wide, phone }]) => [
            <Dye key={`${name}-wide`} id={`${name}-wide`} colour={wide} />,
            <Dye key={`${name}-phone`} id={`${name}-phone`} colour={phone} />,
          ])}
          <Dye id="item" colour={THREAD.item} />
          {/* The thread sits a little above the picture */}
          <filter id="raised" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.4" floodColor="#1a1408" floodOpacity="0.35" />
          </filter>
        </defs>
      </svg>
      <img className="hills__sky" src={SKY} alt="" width={SCENE.width} height={SCENE.height} fetchPriority="high" />
      {LAYERS.map((l) => (
        <div key={l.name} className={`hills__layer hills__layer--${l.name}`} style={layerStyle(l)}>
          <img src={l.src} alt="" width={l.size[0]} height={l.size[1]} />
          {l.creature && l.spot && (
            <svg viewBox={`0 0 ${l.size[0]} ${l.size[1]}`} aria-hidden={links[l.creature] ? undefined : true}>
              <g filter="url(#raised)">
                <g className="creature__spot" style={{ ['--cx' as string]: `${l.spot[0]}px`, ['--cy' as string]: `${l.spot[1]}px` }}>
                  {creature(l.creature)}
                </g>
              </g>
            </svg>
          )}
        </div>
      ))}
      <div className={`hills__tag${active ? ' is-shown' : ''}`} ref={tag} aria-hidden="true">
        {last && (
          <>
            <TagPicture name={last} />
            <span className="hills__tag-word">{words[last]}</span>
          </>
        )}
      </div>
    </div>
  )
}
