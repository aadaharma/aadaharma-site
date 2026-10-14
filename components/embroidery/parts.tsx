'use client'

// Pieces of the embroidery workbench shared by the designer (Designer.tsx) and the
// admin's template editor (app/admin/templates)
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { DEFAULT_COLOUR } from '@/lib/embroidery/motifs'
import type { Pattern } from '@/lib/embroidery/pattern'
import { SHAPES, type Shape } from '@/lib/embroidery/shapes'
import type { Strings } from '@/lib/i18n'
import { Editor, type EditorState, type Tool } from './editor'
import { Icon, ShapeIcon, type IconName } from './icons'

export type T = Strings['designer']

export const SWATCHES = ['#bd0603', '#1f1a17', '#1f3a6b', '#3d6b2a', '#c08a1e', '#6b2a12']
export const TOOLS: { tool: Exclude<Tool, 'place'>; icon: IconName }[] = [
  { tool: 'pen', icon: 'pen' },
  { tool: 'shape', icon: 'shape' },
  { tool: 'erase', icon: 'erase' },
  { tool: 'select', icon: 'select' },
  { tool: 'pan', icon: 'pan' },
]

export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))

const INITIAL: EditorState = {
  tool: 'pen', shape: 'square', colour: DEFAULT_COLOUR, zoom: 1.1, width: 60, height: 40, selection: null, selectionCount: 0,
  placing: null, hasClipboard: false, canUndo: false, canRedo: false, isEmpty: true,
}
const noSubscribe = () => () => {}

// Puts an editor (the canvas) into the element hostRef points to, with the pattern
// makePattern() returns, and keeps `state` up to date
export function useEditor(makePattern: () => Pattern, onCopied: () => void) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const state = useSyncExternalStore(editor?.subscribe ?? noSubscribe, editor?.getState ?? (() => INITIAL), () => INITIAL)
  const make = useRef(makePattern)
  const copied = useRef(onCopied)
  copied.current = onCopied
  useEffect(() => {
    const ed = new Editor(hostRef.current!, make.current(), DEFAULT_COLOUR, () => copied.current())
    setEditor(ed)
    return () => ed.destroy()
  }, [])
  return { hostRef, editor, state }
}

// The tools and zoom buttons down the left side
export function ToolRail({ editor, state, t }: { editor: Editor | null; state: EditorState; t: T }) {
  return (
    <nav className="designer-rail" aria-label={t.tools.label}>
      {TOOLS.map(({ tool, icon }) => (
        <IconButton
          key={tool}
          icon={icon}
          size={22}
          label={t.tools[tool]}
          pressed={state.tool === tool}
          onClick={() => editor?.setTool(tool)}
        />
      ))}
      <hr />
      <IconButton icon="zoomIn" label={t.zoomIn} onClick={() => editor?.zoomIn()} />
      <span className="designer-zoom">{Math.round(state.zoom * 100)} %</span>
      <IconButton icon="zoomOut" label={t.zoomOut} onClick={() => editor?.zoomOut()} />
      <IconButton icon="fit" label={t.fit} onClick={() => editor?.fit()} />
    </nav>
  )
}

export function IconButton({
  icon, label, onClick, disabled, pressed, size, className,
}: { icon: IconName; label: string; onClick: () => void; disabled?: boolean; pressed?: boolean; size?: number; className?: string }) {
  return (
    <button
      type="button"
      className={`icon-button${className ? ` ${className}` : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}

export function ActionButton({ icon, label, onClick, disabled }: { icon: IconName; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="action-button" onClick={onClick} disabled={disabled}>
      <Icon name={icon} size={18} />
      {label}
    </button>
  )
}

export function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="designer-section">
      <h2>
        {title} {note && <small>{note}</small>}
      </h2>
      {children}
    </section>
  )
}

// What the current tool can do: shapes to choose from, selection actions and so on
// (compact: on phones, where there's only room for buttons, not for the explanations)
export function ToolOptions({
  editor, state, t, onCopied, compact,
}: { editor: Editor; state: EditorState; t: T; onCopied: () => void; compact?: boolean }) {
  const { tool, selection, placing } = state
  if (tool === 'shape') {
    return (
      <Section title={t.shape.title} note={t.shape.names[state.shape]}>
        <div className="designer-shapes">
          {(Object.keys(SHAPES) as Shape[]).map((shape) => (
            <button
              key={shape}
              type="button"
              className="icon-button"
              title={t.shape.names[shape]}
              aria-label={t.shape.names[shape]}
              aria-pressed={state.shape === shape}
              onClick={() => editor.setShape(shape)}
            >
              <ShapeIcon shape={shape} />
            </button>
          ))}
        </div>
        <p className="designer-hint">{t.shape.hint}</p>
      </Section>
    )
  }
  if (tool === 'select' && selection) {
    return (
      <Section title={t.select.selection} note={fill(t.select.size, { w: selection.width, h: selection.height, n: state.selectionCount })}>
        <div className="designer-actions">
          <ActionButton icon="recolour" label={t.select.recolour} onClick={() => editor.recolourSelection()} />
          <ActionButton icon="trash" label={t.select.delete} onClick={() => editor.deleteSelection()} />
          <ActionButton
            icon="copy"
            label={t.select.copy}
            onClick={() => {
              editor.copySelection()
              onCopied()
            }}
          />
          <ActionButton icon="paste" label={t.select.paste} onClick={() => editor.paste()} disabled={!state.hasClipboard} />
          <ActionButton icon="mirrorH" label={t.select.mirrorH} onClick={() => editor.mirrorSelection('horizontal')} />
          <ActionButton icon="mirrorV" label={t.select.mirrorV} onClick={() => editor.mirrorSelection('vertical')} />
        </div>
        <p className="designer-hint">{t.select.moveHint}</p>
      </Section>
    )
  }
  if (tool === 'place' && placing) {
    const paste = placing.kind === 'paste'
    return (
      <Section title={paste ? t.placing.paste : fill(t.placing.title, { name: placing.name })} note={fill(t.placing.size, { w: placing.width, h: placing.height })}>
        <div className="designer-actions">
          <ActionButton icon="rotate" label={t.placing.rotate} onClick={() => editor.rotatePlacing()} />
          <ActionButton icon="mirrorH" label={t.placing.mirrorH} onClick={() => editor.mirrorPlacing('horizontal')} />
          <ActionButton icon="mirrorV" label={t.placing.mirrorV} onClick={() => editor.mirrorPlacing('vertical')} />
          <ActionButton icon="check" label={t.placing.done} onClick={() => editor.stopPlacing()} />
        </div>
        <p className="designer-hint">{paste ? t.placing.hint : t.placing.templateHint}</p>
      </Section>
    )
  }
  const text = { pen: t.pen, erase: t.erase, pan: t.pan, select: t.select, shape: t.shape, place: t.pen }[tool]
  if (compact && !(tool === 'select' && state.hasClipboard)) return null
  return (
    <Section title={text.title}>
      <p className="designer-hint">{text.hint}</p>
      {tool === 'select' && state.hasClipboard && (
        <div className="designer-actions">
          <ActionButton icon="paste" label={t.select.paste} onClick={() => editor.paste()} />
        </div>
      )}
    </Section>
  )
}

export function Colours({ colour, t, onChange }: { colour: string; t: T; onChange: (colour: string) => void }) {
  const custom = !SWATCHES.includes(colour)
  return (
    <div className="designer-colours">
      {SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          className="swatch"
          style={{ '--swatch': c } as CSSProperties}
          title={t.colour.names[c as keyof T['colour']['names']]}
          aria-label={t.colour.names[c as keyof T['colour']['names']]}
          aria-pressed={colour === c}
          onClick={() => onChange(c)}
        />
      ))}
      <label className={`swatch swatch--custom${custom ? ' is-on' : ''}`} style={{ '--swatch': colour } as CSSProperties} title={t.colour.custom}>
        <span className="visually-hidden">{t.colour.custom}</span>
        <input type="color" value={colour} onChange={(e) => onChange(e.target.value.toLowerCase())} />
      </label>
    </div>
  )
}

export function GridSize({ t, width, height, onApply }: { t: T; width: number; height: number; onApply: (w: number, h: number) => void }) {
  return (
    <>
      <form
        className="designer-grid-size"
        onSubmit={(e) => {
          e.preventDefault()
          const form = new FormData(e.currentTarget)
          onApply(Number(form.get('width')), Number(form.get('height')))
        }}
      >
        <label>
          {t.grid.width}
          <input name="width" type="number" min={4} max={200} defaultValue={width} inputMode="numeric" />
        </label>
        <label>
          {t.grid.height}
          <input name="height" type="number" min={4} max={200} defaultValue={height} inputMode="numeric" />
        </label>
        <button type="submit" className="action-button">
          {t.grid.apply}
        </button>
      </form>
      <p className="designer-hint">{t.grid.hint}</p>
    </>
  )
}
