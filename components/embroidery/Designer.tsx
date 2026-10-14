'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motifFromJson, motifToJson } from '@/lib/embroidery/motif'
import { CATEGORIES, DEFAULT_COLOUR, TEMPLATES, type Template } from '@/lib/embroidery/motifs'
import { Pattern } from '@/lib/embroidery/pattern'
import { SHAPES, type Shape } from '@/lib/embroidery/shapes'
import { designerUrl, otherLang, type Lang, type Strings } from '@/lib/i18n'
import { drawPreview, patternPng } from './draw'
import { Editor, type EditorState, type Tool } from './editor'
import { Icon, ShapeIcon, type IconName } from './icons'

type T = Strings['designer']
type Props = { lang: Lang; t: T; theme: Strings['theme']; switchLabel: Strings['langSwitch'] }

const SWATCHES = ['#bd0603', '#1f1a17', '#1f3a6b', '#3d6b2a', '#c08a1e', '#6b2a12']
const TOOLS: { tool: Exclude<Tool, 'place'>; icon: IconName }[] = [
  { tool: 'pen', icon: 'pen' },
  { tool: 'shape', icon: 'shape' },
  { tool: 'erase', icon: 'erase' },
  { tool: 'select', icon: 'select' },
  { tool: 'pan', icon: 'pan' },
]

// The drawing is kept in the browser, so reloading the page doesn't lose it
const STORAGE_KEY = 'karelian-embroidery-pattern'

function loadPattern() {
  try {
    const saved = motifFromJson(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
    if (saved) {
      const pattern = new Pattern(saved.width, saved.height)
      pattern.stitches = saved.stitches
      return pattern
    }
  } catch {}
  return new Pattern(60, 40)
}

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))

const INITIAL: EditorState = {
  tool: 'pen', shape: 'square', colour: DEFAULT_COLOUR, zoom: 1.1, width: 60, height: 40, selection: null, selectionCount: 0,
  placing: null, hasClipboard: false, canUndo: false, canRedo: false, isEmpty: true,
}
const noSubscribe = () => () => {}

type Toast = { message: string; action?: { label: string; run: () => void } }

export function Designer({ lang, t, theme, switchLabel }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const state = useSyncExternalStore(editor?.subscribe ?? noSubscribe, editor?.getState ?? (() => INITIAL), () => INITIAL)

  useEffect(() => {
    const pattern = loadPattern()
    const ed = new Editor(hostRef.current!, pattern, DEFAULT_COLOUR, () => setToast({ message: t.toast.copied }))
    let timer = 0
    const stopSaving = pattern.subscribe(() => {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(motifToJson(pattern)))
        } catch {}
      }, 400)
    })
    setEditor(ed)
    return () => {
      clearTimeout(timer)
      stopSaving()
      ed.destroy()
    }
  }, [t])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.action ? 5000 : 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const clear = () => {
    if (!editor) return
    if (state.isEmpty) return setToast({ message: t.toast.empty })
    editor.clear()
    setToast({ message: t.toast.cleared, action: { label: t.toast.undo, run: () => editor.undo() } })
  }

  const download = async () => {
    if (!editor) return
    const { pattern } = editor
    const url = URL.createObjectURL(await patternPng(pattern.width, pattern.height, pattern.stitches))
    const link = document.createElement('a')
    link.href = url
    link.download = 'karelian-embroidery.png'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const onCopied = () => setToast({ message: t.toast.copied })

  return (
    <div className="designer">
      <header className="designer-top">
        <a className="designer-brand" href={lang === 'en' ? '/' : `/${lang}/`} title={t.home}>
          <span className="visually-hidden">{t.home}: </span>
          <span className="designer-brand__name">{t.title}</span>
        </a>
        <div className="designer-top__actions">
          <IconButton icon="undo" label={t.undo} onClick={() => editor?.undo()} disabled={!state.canUndo} />
          <IconButton icon="redo" label={t.redo} onClick={() => editor?.redo()} disabled={!state.canRedo} />
          <span className="designer-sep hide-small" />
          <IconButton icon="clear" label={t.clear} onClick={clear} />
          <IconButton icon="download" label={t.download} onClick={download} />
          <a className="pill" href={designerUrl(otherLang(lang))} hrefLang={switchLabel.lang} lang={switchLabel.lang}>
            <span className="visually-hidden">{switchLabel.label}</span>
            <span aria-hidden="true">{switchLabel.short}</span>
          </a>
          <span className="hide-small">
            <ThemeToggle t={theme} />
          </span>
          <IconButton icon="menu" label={t.openPanel} onClick={() => setPanelOpen(true)} className="panel-toggle" />
        </div>
      </header>

      <div className="designer-body">
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

        <main className="designer-stage" id="main">
          <div className="designer-host" ref={hostRef} role="application" aria-label={t.canvas} />
        </main>

        {/* On phones, a strip above the tools for the tool's buttons */}
        <div className="designer-options-mobile">
          {editor && <ToolOptions editor={editor} state={state} t={t} onCopied={onCopied} compact />}
        </div>

        {panelOpen && <div className="designer-scrim" onClick={() => setPanelOpen(false)} />}
        <aside className={`designer-side${panelOpen ? ' is-open' : ''}`}>
          <div className="designer-side__close">
            <IconButton icon="close" label={t.closePanel} onClick={() => setPanelOpen(false)} />
          </div>
          <div className="designer-options-desktop">
            {editor && <ToolOptions editor={editor} state={state} t={t} onCopied={onCopied} />}
          </div>
          <Section title={t.colour.title} note={t.colour.names[state.colour as keyof T['colour']['names']] ?? state.colour.toUpperCase()}>
            <Colours colour={state.colour} t={t} onChange={(c) => editor?.setColour(c)} />
          </Section>
          <Section title={t.templates.title}>
            <p className="designer-hint">{t.templates.hint}</p>
            <Templates
              lang={lang}
              t={t}
              colour={state.colour}
              onPick={(template) => {
                editor?.startPlacing(template.motif, template.name[lang])
                setPanelOpen(false)
              }}
            />
          </Section>
          {/* The theme switch is in the top bar on wider screens */}
          <div className="designer-side__theme">
            <ThemeToggle t={theme} />
          </div>
          <Section title={t.grid.title}>
            <GridSize
              key={`${state.width}x${state.height}`}
              t={t}
              width={state.width}
              height={state.height}
              onApply={(w, h) => {
                editor?.resize(w, h)
                const s = editor?.getState()
                if (s) setToast({ message: fill(t.toast.resized, { w: s.width, h: s.height }) })
              }}
            />
          </Section>
        </aside>
      </div>

      <div className={`designer-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.run()
                  setToast(null)
                }}
              >
                {toast.action.label}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function IconButton({
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

function ActionButton({ icon, label, onClick, disabled }: { icon: IconName; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="action-button" onClick={onClick} disabled={disabled}>
      <Icon name={icon} size={18} />
      {label}
    </button>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
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
function ToolOptions({
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

function Colours({ colour, t, onChange }: { colour: string; t: T; onChange: (colour: string) => void }) {
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

function Templates({ lang, t, colour, onPick }: { lang: Lang; t: T; colour: string; onPick: (template: Template) => void }) {
  return (
    <>
      {CATEGORIES.map((category) => {
        const list = TEMPLATES.filter((tpl) => tpl.category === category.id)
        if (!list.length) return null
        return (
          <div key={category.id} className="designer-templates">
            <h3>{category[lang]}</h3>
            <div className="designer-templates__cards">
              {list.map((template) => (
                <TemplateCard key={template.id} template={template} lang={lang} t={t} colour={colour} onPick={onPick} />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

function TemplateCard({ template, lang, t, colour, onPick }: { template: Template; lang: Lang; t: T; colour: string; onPick: (template: Template) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (canvas.current) drawPreview(canvas.current, template.motif, colour)
  }, [template, colour])
  return (
    <button type="button" className="template-card" onClick={() => onPick(template)}>
      <canvas ref={canvas} aria-hidden="true" />
      <span className="template-card__name" lang={lang}>
        {template.name[lang]}
      </span>
      <span className="template-card__size">{fill(t.templates.size, { w: template.motif.width, h: template.motif.height })}</span>
    </button>
  )
}

function GridSize({ t, width, height, onApply }: { t: T; width: number; height: number; onApply: (w: number, h: number) => void }) {
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
